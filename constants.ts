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
 * ==========================================
 * CÓDIGO BACKEND PARA GOOGLE APPS SCRIPT
 * ==========================================
 * COPIA Y PEGA ESTO EN: Extensiones > Apps Script
 * HOJA ID: 1HTkRzSs8yavFTT-zqh-lHA_S2Be2X2A5Y1XMDyN13kw
 */

const SHEET_ID = "1HTkRzSs8yavFTT-zqh-lHA_S2Be2X2A5Y1XMDyN13kw";

function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // 1. Configurar Hoja VENTAS
  let salesSheet = ss.getSheetByName("Ventas");
  if (!salesSheet) {
    salesSheet = ss.insertSheet("Ventas");
  }
  
  // Encabezados Hoja Ventas
  const headers = [
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
  
  // Verificar si ya existen los encabezados, si no, ponerlos
  const firstRow = salesSheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow[0] !== "Fecha") {
    salesSheet.clear();
    salesSheet.appendRow(headers);
    salesSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F37021") // Naranja Movilnet
      .setFontColor("white");
  }

  // 2. Hoja PROCDINVENT (Inventario)
  let invSheet = ss.getSheetByName("PROCDINVENT");
  if (!invSheet) {
    invSheet = ss.insertSheet("PROCDINVENT");
    invSheet.getRange("R2").setValue("IMEI");
    invSheet.getRange("S2").setValue("Nombre Producto");
    invSheet.getRange("T2").setValue("Categoría");
    invSheet.getRange("U2").setValue("Precio Base");
    invSheet.getRange("V2").setValue("Stock");
    invSheet.getRange("R2:V2").setFontWeight("bold").setBackground("#00549F").setFontColor("white");
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const action = e.parameter.action || 'inventory';

  // --- OBTENER CLIENTES (Historial de Ventas) ---
  if (action === 'clients') {
    const sheet = ss.getSheetByName("Ventas");
    if (!sheet) return ContentService.createTextOutput("[]");
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return ContentService.createTextOutput("[]");

    // Leer columnas B (Nombre), C (Cédula), D (Teléfono) -> Indices 1, 2, 3
    const data = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
    const clientsMap = new Map();
    
    // Recorrer de abajo hacia arriba para tener los datos más recientes
    for (let i = data.length - 1; i >= 0; i--) {
      const name = data[i][0];
      const id = String(data[i][1]);
      const phone = String(data[i][2]);
      
      if (id && name && !clientsMap.has(id)) {
        clientsMap.set(id, { name, id, phone });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(Array.from(clientsMap.values())))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // --- OBTENER INVENTARIO (PROCDINVENT) ---
  const sheet = ss.getSheetByName("PROCDINVENT");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([]));

  const lastRow = sheet.getLastRow();
  // Datos empiezan en fila 3, Columnas R-V
  if (lastRow < 3) return ContentService.createTextOutput(JSON.stringify([]));
  
  // Rango R3:V_lastRow
  const data = sheet.getRange(3, 18, lastRow - 2, 5).getValues();
  
  const inventory = data.map(row => ({
    code: String(row[0]),       // R: IMEI
    name: String(row[1]),       // S: Nombre
    category: String(row[2]),   // T: Categoría
    priceUSD: Number(row[3]) || 0, // U: Precio
    stock: Number(row[4]) || 0  // V: Stock
  })).filter(item => item.name && item.code);

  return ContentService.createTextOutput(JSON.stringify(inventory))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Ventas");
  
  const data = JSON.parse(e.postData.contents);
  
  // Usamos concatenación simple para evitar errores de sintaxis en Apps Script
  const itemString = data.items.map(function(i) {
    return i.code + " - " + i.name + " (x" + i.quantity + ")";
  }).join(", ");
  
  // Formatear Crédito
  let creditString = "N/A";
  if (data.creditDetails) {
    creditString = data.creditDetails.provider + 
      " | Inicial: $" + data.creditDetails.initialPaymentUSD + 
      " | Cuotas: " + data.creditDetails.installments.length;
  }

  const dateStr = new Date(data.date).toLocaleString("es-VE");

  // Columnas: Fecha, Cliente, Cédula, Teléfono, IMEI, Total $, Total Bs, Tasa, Pago, Detalles, Obs, Estado
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
  
  updateStockInProcdinvent(data.items);
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: "Venta registrada"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateStockInProcdinvent(items) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("PROCDINVENT");
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 3) return; // No hay inventario para actualizar

  // Columna R (18) = IMEI/Código
  const imeiValues = sheet.getRange(3, 18, lastRow - 2, 1).getValues().flat();
  
  items.forEach(function(item) {
    // Buscar índice del código (convertimos a String para asegurar coincidencia)
    const index = imeiValues.findIndex(function(code) { return String(code) === String(item.code); });
    
    if (index !== -1) {
      const row = index + 3; // +3 porque los datos empiezan en fila 3
      // Stock está en columna V (22)
      const stockCell = sheet.getRange(row, 22);
      const currentStock = Number(stockCell.getValue());
      stockCell.setValue(currentStock - item.quantity);
    }
  });
}
`export const COMPANY_INFO = {
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
 * ==========================================
 * CÓDIGO BACKEND PARA GOOGLE APPS SCRIPT
 * ==========================================
 * COPIA Y PEGA ESTO EN: Extensiones > Apps Script
 * HOJA ID: 1HTkRzSs8yavFTT-zqh-lHA_S2Be2X2A5Y1XMDyN13kw
 */

const SHEET_ID = "1HTkRzSs8yavFTT-zqh-lHA_S2Be2X2A5Y1XMDyN13kw";

function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // 1. Configurar Hoja VENTAS
  let salesSheet = ss.getSheetByName("Ventas");
  if (!salesSheet) {
    salesSheet = ss.insertSheet("Ventas");
  }
  
  // Encabezados Hoja Ventas
  const headers = [
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
  
  // Verificar si ya existen los encabezados, si no, ponerlos
  const firstRow = salesSheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow[0] !== "Fecha") {
    salesSheet.clear();
    salesSheet.appendRow(headers);
    salesSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F37021") // Naranja Movilnet
      .setFontColor("white");
  }

  // 2. Hoja PROCDINVENT (Inventario)
  let invSheet = ss.getSheetByName("PROCDINVENT");
  if (!invSheet) {
    invSheet = ss.insertSheet("PROCDINVENT");
    invSheet.getRange("R2").setValue("IMEI");
    invSheet.getRange("S2").setValue("Nombre Producto");
    invSheet.getRange("T2").setValue("Categoría");
    invSheet.getRange("U2").setValue("Precio Base");
    invSheet.getRange("V2").setValue("Stock");
    invSheet.getRange("R2:V2").setFontWeight("bold").setBackground("#00549F").setFontColor("white");
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const action = e.parameter.action || 'inventory';

  // --- OBTENER CLIENTES (Historial de Ventas) ---
  if (action === 'clients') {
    const sheet = ss.getSheetByName("Ventas");
    if (!sheet) return ContentService.createTextOutput("[]");
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return ContentService.createTextOutput("[]");

    // Leer columnas B (Nombre), C (Cédula), D (Teléfono) -> Indices 1, 2, 3
    const data = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
    const clientsMap = new Map();
    
    // Recorrer de abajo hacia arriba para tener los datos más recientes
    for (let i = data.length - 1; i >= 0; i--) {
      const name = data[i][0];
      const id = String(data[i][1]);
      const phone = String(data[i][2]);
      
      if (id && name && !clientsMap.has(id)) {
        clientsMap.set(id, { name, id, phone });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(Array.from(clientsMap.values())))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // --- OBTENER INVENTARIO (PROCDINVENT) ---
  const sheet = ss.getSheetByName("PROCDINVENT");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([]));

  const lastRow = sheet.getLastRow();
  // Datos empiezan en fila 3, Columnas R-V
  if (lastRow < 3) return ContentService.createTextOutput(JSON.stringify([]));
  
  // Rango R3:V_lastRow
  const data = sheet.getRange(3, 18, lastRow - 2, 5).getValues();
  
  const inventory = data.map(row => ({
    code: String(row[0]),       // R: IMEI
    name: String(row[1]),       // S: Nombre
    category: String(row[2]),   // T: Categoría
    priceUSD: Number(row[3]) || 0, // U: Precio
    stock: Number(row[4]) || 0  // V: Stock
  })).filter(item => item.name && item.code);

  return ContentService.createTextOutput(JSON.stringify(inventory))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Ventas");
  
  const data = JSON.parse(e.postData.contents);
  
  // Usamos concatenación simple para evitar errores de sintaxis en Apps Script
  const itemString = data.items.map(function(i) {
    return i.code + " - " + i.name + " (x" + i.quantity + ")";
  }).join(", ");
  
  // Formatear Crédito
  let creditString = "N/A";
  if (data.creditDetails) {
    creditString = data.creditDetails.provider + 
      " | Inicial: $" + data.creditDetails.initialPaymentUSD + 
      " | Cuotas: " + data.creditDetails.installments.length;
  }

  const dateStr = new Date(data.date).toLocaleString("es-VE");

  // Columnas: Fecha, Cliente, Cédula, Teléfono, IMEI, Total $, Total Bs, Tasa, Pago, Detalles, Obs, Estado
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
  
  updateStockInProcdinvent(data.items);
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: "Venta registrada"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateStockInProcdinvent(items) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("PROCDINVENT");
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 3) return; // No hay inventario para actualizar

  // Columna R (18) = IMEI/Código
  const imeiValues = sheet.getRange(3, 18, lastRow - 2, 1).getValues().flat();
  
  items.forEach(function(item) {
    // Buscar índice del código (convertimos a String para asegurar coincidencia)
    const index = imeiValues.findIndex(function(code) { return String(code) === String(item.code); });
    
    if (index !== -1) {
      const row = index + 3; // +3 porque los datos empiezan en fila 3
      // Stock está en columna V (22)
      const stockCell = sheet.getRange(row, 22);
      const currentStock = Number(stockCell.getValue());
      stockCell.setValue(currentStock - item.quantity);
    }
  });
}
`;