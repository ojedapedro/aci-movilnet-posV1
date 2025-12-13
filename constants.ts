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
  
  var salesHeaders = [
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
  
  // Verificar encabezados de Ventas
  var range = salesSheet.getRange(1, 1, 1, salesHeaders.length);
  var values = range.getValues()[0];
  if (values[0] !== "Fecha") {
    // Solo si está vacía o incorrecta, agregamos encabezados
    if (salesSheet.getLastRow() < 1) {
       salesSheet.appendRow(salesHeaders);
       salesSheet.getRange(1, 1, 1, salesHeaders.length)
         .setFontWeight("bold")
         .setBackground("#F37021") // Naranja Movilnet
         .setFontColor("white");
    }
  }

  // --- 2. Configurar Hoja PRODUCTOS ---
  // Estructura: IMEI(A), Nombre(B), Categ(C), Precio(D), Stock(E), Proveedor(F), Fecha(G), Barcode(H)
  var invSheet = ss.getSheetByName("Productos");
  if (!invSheet) {
    invSheet = ss.insertSheet("Productos");
    invSheet.appendRow(["IMEI", "Nombre Producto", "Categoría", "Precio Base", "Stock", "Proveedor", "Fecha Ingreso", "BARCODE"]);
    invSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#00549F").setFontColor("white");
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var action = e.parameter.action || 'inventory';

  // --- OBTENER CLIENTES (Historial de Ventas) ---
  if (action === 'clients') {
    var sheet = ss.getSheetByName("Ventas");
    if (!sheet) return ContentService.createTextOutput("[]");
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return ContentService.createTextOutput("[]");

    var data = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
    var clientsMap = {}; 
    var clientsList = [];

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

  // --- OBTENER INVENTARIO (Hoja: Productos) ---
  var sheet = ss.getSheetByName("Productos");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([]));

  var lastRow = sheet.getLastRow();
  // Estructura A:H (Columnas 1 a 8)
  if (lastRow < 2) return ContentService.createTextOutput(JSON.stringify([]));
  
  // Leer columnas A hasta H (8 columnas)
  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  
  var inventory = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    
    // Column Index Mapping (0-based):
    // 0: IMEI (A)
    // 1: Nombre (B)
    // 2: Categ (C)
    // 3: Precio (D)
    // 4: Stock (E)
    // 7: Barcode (H)

    // Validar que tenga IMEI/Código (0) o Nombre (1)
    if (row[0] || row[1]) {
       // Usamos IMEI (col A) como código principal
       var code = String(row[0]);
       
       // Si el IMEI está vacío, intentar usar BARCODE (col H)
       if (!code || code === "") {
          code = String(row[7]); 
       }

       inventory.push({
         id: code,                   // <--- FIX: Enviamos ID explícito
         code: code,                 // A o H
         name: String(row[1]),       // B
         category: String(row[2]),   // C
         priceUSD: Number(row[3]) || 0, // D
         stock: Number(row[4]) || 0  // E
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
    
    var itemString = "";
    if (data.items && data.items.length) {
      itemString = data.items.map(function(i) {
        return i.code + " - " + i.name + " (x" + i.quantity + ")";
      }).join(", ");
    }
    
    var creditString = "N/A";
    if (data.creditDetails) {
      creditString = data.creditDetails.provider + 
        " | Inicial: $" + data.creditDetails.initialPaymentUSD + 
        " | Cuotas: " + (data.creditDetails.installments ? data.creditDetails.installments.length : 0);
    }

    // Fecha GMT-4 Venezuela
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
      updateStockInProductos(data.items);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Venta registrada exitosamente"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Error: " + err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStockInProductos(items) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Productos");
  
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Obtenemos Columna A (IMEI) y Columna H (Barcode) para buscar
  // Rango: A2:H_lastRow
  var dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
  var values = dataRange.getValues();
  
  // Recorrer items vendidos
  items.forEach(function(item) {
    var soldCode = String(item.code);
    
    // Buscar fila correspondiente
    for (var i = 0; i < values.length; i++) {
      var rowImei = String(values[i][0]);   // Col A
      var rowBarcode = String(values[i][7]); // Col H
      
      // Coincidencia por IMEI o por Barcode
      if (rowImei === soldCode || rowBarcode === soldCode) {
        var rowIndex = i + 2; // +2 offset (encabezados)
        // Columna Stock es la E (columna 5)
        var currentStock = Number(values[i][4]); // Index 4 = Col E
        
        // Actualizar celda
        sheet.getRange(rowIndex, 5).setValue(currentStock - item.quantity);
        break; // Stop looking for this item once found
      }
    }
  });
}
`;