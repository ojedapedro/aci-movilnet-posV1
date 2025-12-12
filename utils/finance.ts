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
        
        // Find next 15th or End of Month/30th
        while (!found) {
            nextDate.setDate(nextDate.getDate() + 1);
            const day = nextDate.getDate();
            const lastDayOfMonth = getEndOfMonth(nextDate.getFullYear(), nextDate.getMonth());
            
            // Logic: Pay on 15th OR the last day of the month (which covers 28, 29, 30, 31)
            // Ideally we want "15 and 30", but Feb doesn't have 30.
            if (day === 15 || day === lastDayOfMonth || day === 30) {
                // If it's the 30th or last day, we take it.
                // Avoid duplicate trigger if month has 31 days (don't trigger on 30 AND 31)
                // If today is 30th and month has 31, we wait for next cycle? 
                // Let's stick to strict: if we hit 15, take it. If we hit the absolute last day of month, take it.
                // OR if we hit 30 and it's not Feb, take it.
                
                if (day === 15) {
                    found = true;
                } else if (day === lastDayOfMonth) {
                    found = true;
                } else if (day === 30) {
                     // If month has 31 days, 30 is fine too as "end of month" proximity
                     found = true;
                }
            }
        }
        
        currentDate = new Date(nextDate); // Update cursor

        installments.push({
            number: i,
            date: currentDate.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
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