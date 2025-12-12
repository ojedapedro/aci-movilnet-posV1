import { Product, SaleData, SheetResponse, Client } from '../types';
import { MOCK_INVENTORY, MOCK_CLIENTS } from '../constants';

// =============================================================================================
// INSTRUCCIONES:
// 1. Ve a tu Google Sheet > Extensiones > Apps Script.
// 2. Publica el script como "Aplicación Web".
// 3. Importante: En "Quién tiene acceso", selecciona "Cualquier usuario" (Anyone).
// 4. Copia la URL generada (termina en /exec) y pégala abajo dentro de las comillas.
// =============================================================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxqK8GUCAeseQ1Odde0eJ8LIJQS8OElaCywh5xpuANCWWiwpseNFqUHOV9aC8uKeoHB/exec'; // <-- PEGA TU URL DE APPS SCRIPT AQUÍ. EJEMPLO: 'https://script.google.com/macros/s/AKfycby.../exec'

export const fetchInventory = async (): Promise<Product[]> => {
    if (!API_URL) {
        // Return mock data if no API URL is set (Development Mode)
        console.warn("Modo Demo: API_URL no configurada en services/googleSheetService.ts");
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
        // Return mock data if no API URL is set (Development Mode)
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_CLIENTS), 600);
        });
    }

    try {
        const response = await fetch(`${API_URL}?action=clients`);
        const data = await response.json();
        // Ensure data matches Client interface
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
            setTimeout(() => resolve({ success: true, message: "Venta registrada exitosamente (Modo Demo - Configura API_URL)" }), 1500);
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
        return { success: false, message: "Error de conexión con Google Sheets. Verifica la URL y los permisos." };
    }
};