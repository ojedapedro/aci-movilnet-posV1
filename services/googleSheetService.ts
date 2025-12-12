import { Product, SaleData, SheetResponse, Client } from '../types';
import { MOCK_INVENTORY, MOCK_CLIENTS } from '../constants';

// =============================================================================================
// ¡ATENCIÓN!
// Pega aquí la URL de tu Web App de Google Apps Script.
// Pasos: Extensiones > Apps Script > Implementar > Nueva implementación > Web App > "Cualquier usuario"
// =============================================================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbz7VEclop6l85Z5uvhU06jCIDbM9wd2cPEH_2US7k_uRnFAlYd7Qq3J1i__gZOx0Xphng/exe';
export const fetchInventory = async (): Promise<Product[]> => {
    if (!API_URL) {
        console.warn("Modo Demo: API_URL no configurada. Usando datos de prueba.");
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_INVENTORY), 800);
        });
    }

    try {
        const response = await fetch(`${API_URL}?action=inventory`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching inventory", error);
        return [];
    }
};

export const fetchClients = async (): Promise<Client[]> => {
    if (!API_URL) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_CLIENTS), 600);
        });
    }

    try {
        const response = await fetch(`${API_URL}?action=clients`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error fetching clients", error);
        return [];
    }
}

export const saveSale = async (sale: SaleData): Promise<SheetResponse> => {
    if (!API_URL) {
        console.log("Saving sale (MOCK):", sale);
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, message: "Venta registrada exitosamente (Modo Demo)" }), 1500);
        });
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(sale)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error saving sale", error);
        return { success: false, message: "Error de conexión. Verifica la URL de Apps Script." };
    }
};