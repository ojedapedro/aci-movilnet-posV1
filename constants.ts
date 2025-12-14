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
 * 2. PEGA ESTE CÓDIGO.
 * 3. GUARDA Y PUBLICA COMO NUEVA VERSIÓN.
 * 
 * NOTA: Este script cambia la estructura de la hoja 'Ventas'.
 * La Columna A ahora será "ID Venta" (PTV-XXXX).
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
  
  // NUEVA ESTRUCTURA: Col A = ID Venta
  var salesHeaders = [
    "ID Venta",
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
  if (salesSheet.getLastRow() < 1) {
     salesSheet.appendRow(salesHeaders);
     salesSheet.getRange(1, 1, 1, salesHeaders.length)
       .setFontWeight("bold")
       .setBackground("#F37021") // Naranja Movilnet
       .setFontColor("white");
  } else {
     // Si la columna A1 no dice "ID Venta", insertamos columna
     var a1 = salesSheet.getRange("A1").getValue();
     if (a1 !== "ID Venta") {
        salesSheet.insertColumns(1);
        salesSheet.getRange("A1").setValue("ID Venta").setFontWeight("bold").setBackground("#F37021").setFontColor("white");
     }
  }

  // --- 2. Configurar Hoja PRODUCTOS ---
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

    // Ajuste por nueva columna ID:
    // Col A(1)=ID, Col B(2)=Fecha, Col C(3)=Nombre, Col D(4)=Cedula, Col E(5)=Telefono
    // Leemos desde C2 hasta E_lastrow
    var data = sheet.getRange(2, 3, lastRow - 1, 3).getValues();
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
  if (lastRow < 2) return ContentService.createTextOutput(JSON.stringify([]));
  
  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  
  var inventory = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (row[0] || row[1]) {
       var code = String(row[0]);
       if (!code || code === "") {
          code = String(row[7]); 
       }

       inventory.push({
         id: code,
         code: code,
         name: String(row[1]),
         category: String(row[2]),
         priceUSD: Number(row[3]) || 0,
         stock: Number(row[4]) || 0
       });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(inventory))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Evitar colisiones de IDs

  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Ventas");
    var data = JSON.parse(e.postData.contents);
    
    // --- GENERAR ID CORRELATIVO (PTV-XXXXXXXX) ---
    var nextId = "PTV-00000001";
    var lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      // Obtenemos todos los valores de la columna A (ID)
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      // Filtramos vacíos
      var validIds = ids.filter(function(id) { return id && String(id).indexOf("PTV-") === 0; });
      
      if (validIds.length > 0) {
        var lastIdVal = validIds[validIds.length - 1]; // Tomamos el último válido
        var match = String(lastIdVal).match(/PTV-(\\d+)/);
        if (match) {
           var currentNum = parseInt(match[1], 10);
           var nextNum = currentNum + 1;
           nextId = "PTV-" + ("00000000" + nextNum).slice(-8);
        }
      }
    }

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
    
    // Método de pago completo (incluyendo detalle de efectivo si aplica)
    var paymentFull = data.paymentMethod;
    if (data.cashMethod) {
       paymentFull += " (" + data.cashMethod + ")";
    }

    // Fecha GMT-4 Venezuela
    var dateObj = new Date(data.date);
    var dateStr = Utilities.formatDate(dateObj, "GMT-4", "dd/MM/yyyy hh:mm a");

    sheet.appendRow([
      nextId,           // Col A: ID Venta
      dateStr,          // Col B: Fecha
      data.clientName,
      String(data.clientId),
      String(data.clientPhone),
      itemString,
      data.totalUSD,
      data.totalBs,
      data.exchangeRate,
      paymentFull,
      creditString,
      data.observations,
      "Completado"
    ]);
    
    if (data.items) {
      updateStockInProductos(data.items);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
        success: true, 
        message: "Venta registrada exitosamente",
        data: { saleId: nextId } // Retornamos el ID al frontend
    })).setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Error: " + err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function updateStockInProductos(items) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Productos");
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
  var values = dataRange.getValues();
  
  items.forEach(function(item) {
    var soldCode = String(item.code);
    for (var i = 0; i < values.length; i++) {
      var rowImei = String(values[i][0]);
      var rowBarcode = String(values[i][7]);
      if (rowImei === soldCode || rowBarcode === soldCode) {
        var rowIndex = i + 2;
        var currentStock = Number(values[i][4]);
        sheet.getRange(rowIndex, 5).setValue(currentStock - item.quantity);
        break;
      }
    }
  });
}
`;