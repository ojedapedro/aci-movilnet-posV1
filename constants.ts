export const COMPANY_INFO = {
    name: 'ACI Movilnet',
    address: 'Av. Lara, Valencia, Venezuela',
    phone: '0426 7408955',
    logoUrl: 'https://i.ibb.co/hFq3BtD9/Movilnet-logo-0.png'
};

export const MOCK_INVENTORY = [
    { id: '1', code: '8958060000', name: 'Simcard Triple Corte', priceUSD: 5, stock: 100 },
    { id: '2', code: '1234567890', name: 'Samsung Galaxy A14', priceUSD: 150, stock: 10 },
    { id: '3', code: '9876543210', name: 'Xiaomi Redmi Note 12', priceUSD: 180, stock: 8 },
];

export const MOCK_CLIENTS = [
    { name: 'Juan Perez', id: 'V12345678', phone: '04141234567' },
    { name: 'Maria Rodriguez', id: 'V87654321', phone: '04241234567' },
];

// Instructions for the user to deploy the backend
export const BACKEND_SCRIPT_INSTRUCTIONS = `
/**
 * ==============================================================
 *  ⚠️ INSTRUCCIONES IMPORTANTES ⚠️
 * ==============================================================
 * 1. BORRA TODO EL CÓDIGO QUE HAYA ACTUALMENTE EN ESTE ARCHIVO.
 *    (El archivo debe quedar totalmente en blanco antes de pegar).
 * 2. PEGA ESTE CÓDIGO.
 * 3. GUARDA (Icono de Disquete).
 * 4. DALE A "IMPLEMENTAR" > "GESTIONAR IMPLEMENTACIONES" > EDITAR > VERSION "NUEVA" > LISTO.
 * 
 * HOJA ID: 1HTkRzSs8yavFTT-zqh-lHA_S2Be2X2A5Y1XMDyN13kw
 */

var SHEET_ID = "1HTkRzSs8yavFTT-zqh-lHA_S2Be2X2A5Y1XMDyN13kw";

function setup() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  
  // --- 1. Configurar Hoja VENTAS ---
  var salesSheet = ss.getSheetByName("Ventas");
  if (!salesSheet) {
    salesSheet = ss.insertSheet("Ventas");
  }
  
  var headers = [
    "Fecha", 
    "Nombre Cliente", 
    "Cédula", 
    "Teléfono", 
    "IMEI / Productos", 
    "Precio Total ($)", 
    "Precio Total (Bs)", 
    "Tasa Cambio", 
    "Forma Pago", 
    "Detalles Crédito", 
    "Observaciones", 
    "Estado"
  ];
  
  // Verificar encabezados
  var range = salesSheet.getRange(1, 1, 1, headers.length);
  var values = range.getValues()[0];
  if (values[0] !== "Fecha") {
    salesSheet.clear(); // Limpiar si no coincide estructura
    salesSheet.appendRow(headers);
    salesSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F37021") // Naranja Movilnet
      .setFontColor("white");
  }

  // --- 2. Hoja PROCDINVENT (Inventario) ---
  var invSheet = ss.getSheetByName("PROCDINVENT");
  if (!invSheet) {
    invSheet = ss.insertSheet("PROCDINVENT");
    // Crear encabezados solo si es nueva
    invSheet.getRange("R2").setValue("IMEI");
    invSheet.getRange("S2").setValue("Nombre Producto");
    invSheet.getRange("T2").setValue("Categoría");
    invSheet.getRange("U2").setValue("Precio Base");
    invSheet.getRange("V2").setValue("Stock");
    invSheet.getRange("R2:V2").setFontWeight("bold").setBackground("#00549F").setFontColor("white");
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var action = e.parameter.action || 'inventory';

  // --- OBTENER CLIENTES (Historial) ---
  if (action === 'clients') {
    var sheet = ss.getSheetByName("Ventas");
    if (!sheet) return ContentService.createTextOutput("[]");
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return ContentService.createTextOutput("[]");

    // Columnas B, C, D (Nombre, Cédula, Teléfono)
    var data = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
    var clientsMap = {}; // Usamos objeto simple para compatibilidad
    var clientsList = [];

    // Recorrer inversamente para obtener los más recientes
    for (var i = data.length - 1; i >= 0; i--) {
      var name = data[i][0];
      var id = String(data[i][1]);
      var phone = String(data[i][2]);
      
      if (id && name && !clientsMap[id]) {
        clientsMap[id] = true;
        clientsList.push({ name: name, id: id, phone: phone });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(clientsList))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // --- OBTENER INVENTARIO (PROCDINVENT) ---
  var sheet = ss.getSheetByName("PROCDINVENT");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([]));

  var lastRow = sheet.getLastRow();
  // Datos empiezan fila 3, Columnas R(18) a V(22)
  if (lastRow < 3) return ContentService.createTextOutput(JSON.stringify([]));
  
  var data = sheet.getRange(3, 18, lastRow - 2, 5).getValues();
  
  var inventory = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    // Validar que tenga Nombre (col 1) y Stock (col 4) > 0
    if (row[1] && row[0]) {
       inventory.push({
         code: String(row[0]),       // R: IMEI
         name: String(row[1]),       // S: Nombre
         category: String(row[2]),   // T: Categ
         priceUSD: Number(row[3]) || 0, // U: Precio
         stock: Number(row[4]) || 0  // V: Stock
       });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(inventory))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Ventas");
    
    var data = JSON.parse(e.postData.contents);
    
    // Concatenación segura
    var itemString = "";
    if (data.items && data.items.length) {
      itemString = data.items.map(function(i) {
        return i.code + " - " + i.name + " (x" + i.quantity + ")";
      }).join(", ");
    }
    
    // Crédito
    var creditString = "N/A";
    if (data.creditDetails) {
      creditString = data.creditDetails.provider + 
        " | Inicial: $" + data.creditDetails.initialPaymentUSD + 
        " | Cuotas: " + (data.creditDetails.installments ? data.creditDetails.installments.length : 0);
    }

    // Fecha con formato local Venezuela (GMT-4)
    var dateObj = new Date(data.date);
    var dateStr = Utilities.formatDate(dateObj, "GMT-4", "dd/MM/yyyy hh:mm a");

    sheet.appendRow([
      dateStr,
      data.clientName,
      String(data.clientId),
      String(data.clientPhone),
      itemString,
      data.totalUSD,
      data.totalBs,
      data.exchangeRate,
      data.paymentMethod,
      creditString,
      data.observations,
      "Completado"
    ]);
    
    if (data.items) {
      updateStockInProcdinvent(data.items);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Venta registrada exitosamente"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Error: " + err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStockInProcdinvent(items) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("PROCDINVENT");
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 3) return;

  // Columna R (18) = IMEI
  var imeiValues = sheet.getRange(3, 18, lastRow - 2, 1).getValues();
  
  // Aplanar array
  var flatImeis = [];
  for (var k = 0; k < imeiValues.length; k++) {
    flatImeis.push(String(imeiValues[k][0]));
  }
  
  items.forEach(function(item) {
    var codeToFind = String(item.code);
    var index = flatImeis.indexOf(codeToFind);
    
    if (index !== -1) {
      var row = index + 3; // +3 offset
      // Columna V (22) es Stock
      var stockCell = sheet.getRange(row, 22);
      var currentStock = Number(stockCell.getValue());
      stockCell.setValue(currentStock - item.quantity);
    }
  });
}
`;