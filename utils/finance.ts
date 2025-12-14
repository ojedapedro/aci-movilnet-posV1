import { Installment } from '../types';

export const formatCurrency = (amount: number, currency: 'USD' | 'VES') => {
    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount);
};

// Helper to get end of month date
const getEndOfMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

export const calculateInstallments = (
    totalAmountUSD: number, 
    rate: number, 
    initialPercentage: number = 0.4 
): { initialUSD: number, initialBs: number, installments: Installment[] } => {
    
    const initialUSD = totalAmountUSD * initialPercentage;
    const remainingUSD = totalAmountUSD - initialUSD;
    // Round to 2 decimals to avoid weird floating points
    const installmentAmountUSD = Math.round((remainingUSD / 6) * 100) / 100;
    
    const installments: Installment[] = [];
    let currentDate = new Date();
    
    for (let i = 1; i <= 6; i++) {
        let nextDate = new Date(currentDate);
        let found = false;
        
        // Find next 15th or 30th (or End of Month if month is short)
        while (!found) {
            nextDate.setDate(nextDate.getDate() + 1);
            const day = nextDate.getDate();
            const lastDayOfMonth = getEndOfMonth(nextDate.getFullYear(), nextDate.getMonth());
            
            // Logic: Pay strictly on the 15th OR the 30th.
            // Exception: If month has less than 30 days (Feb), pay on the last day.
            
            const isFifteenth = day === 15;
            const isThirtieth = day === 30;
            const isEndOfMonthShort = day === lastDayOfMonth && lastDayOfMonth < 30; // Catch Feb 28/29

            if (isFifteenth || isThirtieth || isEndOfMonthShort) {
                found = true;
            }
        }
        
        currentDate = new Date(nextDate); // Update cursor

        // Manually format date to dd/mm/yyyy to avoid locale issues in print
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();

        installments.push({
            number: i,
            date: `${day}/${month}/${year}`,
            amountUSD: installmentAmountUSD,
            amountBs: installmentAmountUSD * rate
        });
    }

    return {
        initialUSD,
        initialBs: initialUSD * rate,
        installments
    };
};