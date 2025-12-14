import React from 'react';
import { SaleData, PaymentMethod } from '../types';
import { COMPANY_INFO } from '../constants';
import { formatCurrency } from '../utils/finance';

interface InvoiceProps {
    data: SaleData;
}

const Invoice: React.FC<InvoiceProps> = ({ data }) => {
    // Calculate initial payment equivalent in Bs
    const initialBs = data.creditDetails 
        ? data.creditDetails.initialPaymentUSD * data.exchangeRate 
        : 0;

    return (
        <div id="printable-area" className="bg-white text-gray-800 hidden print:flex flex-col w-full max-w-[210mm] min-h-[297mm] mx-auto font-sans">
            <style>
                {`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    #printable-area { 
                        padding: 10mm 15mm; 
                        width: 100%; 
                        box-sizing: border-box;
                    }
                    .break-inside-avoid {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
                `}
            </style>
            
            {/* Wrapper for content to push footer down */}
            <div className="flex-grow">
                
                {/* --- HEADER SECTION --- */}
                <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
                    {/* Left: Logo & Address */}
                    <div className="flex flex-col justify-start">
                        <img 
                            src={COMPANY_INFO.logoUrl} 
                            alt="Movilnet" 
                            className="h-24 w-auto object-contain mb-4 self-start" 
                        />
                        <div className="text-sm text-gray-600 leading-relaxed">
                            <p className="font-bold text-lg text-[#00549F]">{COMPANY_INFO.name}</p>
                            <p>{COMPANY_INFO.address}</p>
                            <p>Teléfono: {COMPANY_INFO.phone}</p>
                        </div>
                    </div>

                    {/* Right: Invoice Meta Data */}
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-[#F37021] mb-2 tracking-tight">RECIBO DE VENTA</h2>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                <span className="font-semibold text-gray-400 uppercase text-xs mr-2">Fecha de Emisión:</span>
                                <span className="font-medium text-gray-900">
                                    {new Date(data.date).toLocaleDateString('es-VE')} {new Date(data.date).toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </p>
                            <p>
                                <span className="font-semibold text-gray-400 uppercase text-xs mr-2">Nro. Control:</span> 
                                <span className="font-mono font-bold text-lg text-[#00549F]">
                                    {data.id ? data.id : data.date.replace(/\D/g,'').slice(0, 10)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- CLIENT INFO SECTION --- */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100 break-inside-avoid">
                    <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                            <span className="block text-gray-500 font-bold uppercase text-[10px] tracking-wider mb-1">Cliente</span>
                            <span className="block text-gray-900 font-bold text-base capitalize">{data.clientName}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 font-bold uppercase text-[10px] tracking-wider mb-1">Identificación (C.I./RIF)</span>
                            <span className="block text-gray-900 font-medium text-base">{data.clientId}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 font-bold uppercase text-[10px] tracking-wider mb-1">Teléfono</span>
                            <span className="block text-gray-900 font-medium text-base">{data.clientPhone}</span>
                        </div>
                    </div>
                </div>

                {/* --- ITEMS TABLE --- */}
                <div className="mb-10">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#00549F] text-white text-xs uppercase tracking-wider">
                                <th className="text-left py-3 px-4 font-bold rounded-tl-lg rounded-bl-lg w-[50%]">Descripción / Producto</th>
                                <th className="text-center py-3 px-2 font-bold">Cant.</th>
                                <th className="text-right py-3 px-2 font-bold">Precio Unit.</th>
                                <th className="text-right py-3 px-4 font-bold rounded-tr-lg rounded-br-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                            {data.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 break-inside-avoid">
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-gray-900 text-base">{item.name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1">
                                            <span className="bg-gray-100 px-1 rounded">IMEI/COD:</span> {item.code}
                                        </div>
                                    </td>
                                    <td className="text-center py-4 px-2 font-medium">{item.quantity}</td>
                                    <td className="text-right py-4 px-2">{formatCurrency(item.priceUSD, 'USD')}</td>
                                    <td className="text-right py-4 px-4 font-bold text-gray-900">{formatCurrency(item.priceUSD * item.quantity, 'USD')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- SUMMARY & PAYMENT SECTION --- */}
                <div className="flex justify-between items-start mb-10 break-inside-avoid">
                    
                    {/* Left: Payment Details & Notes */}
                    <div className="w-[55%] pr-8">
                        <div className="mb-6">
                            <h3 className="font-bold text-[#00549F] text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Método de Pago</h3>
                            <div className="text-base text-gray-800 font-medium">
                                {data.paymentMethod} 
                                {data.paymentMethod === PaymentMethod.CASH && data.cashMethod && (
                                    <span className="ml-2 inline-block bg-[#F37021]/10 text-[#F37021] text-xs px-2 py-0.5 rounded-full border border-[#F37021]/20">
                                        {data.cashMethod}
                                    </span>
                                )}
                            </div>
                            {data.paymentMethod === PaymentMethod.CREDIT && data.creditDetails && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Proveedor: <span className="font-bold text-gray-700">{data.creditDetails.provider}</span>
                                </p>
                            )}
                        </div>

                        {data.observations && (
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">Observaciones</p>
                                <p className="text-sm text-gray-700 italic leading-snug">{data.observations}</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Right: Totals Box */}
                    <div className="w-[40%] bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-500 font-medium text-sm">Subtotal</span>
                            <span className="font-bold text-gray-800">{formatCurrency(data.totalUSD, 'USD')}</span>
                        </div>
                        
                        <div className="w-full h-px bg-gray-200 my-2"></div>
                        
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[#00549F] font-bold text-lg">TOTAL A PAGAR</span>
                            <span className="text-2xl font-black text-[#00549F]">{formatCurrency(data.totalUSD, 'USD')}</span>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase font-bold">Referencia en Bs.</span>
                            <span className="font-bold text-gray-600">{formatCurrency(data.totalBs, 'VES')}</span>
                        </div>
                    </div>
                </div>

                {/* --- CREDIT SCHEDULE (Conditional) --- */}
                {data.paymentMethod === PaymentMethod.CREDIT && data.creditDetails && (
                    <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden break-inside-avoid">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="text-gray-700 font-bold text-xs uppercase tracking-wider">
                                Cronograma de Financiamiento ({data.creditDetails.provider})
                            </h4>
                        </div>
                        
                        <div className="p-4">
                            {/* Initial Payment Highlight */}
                            <div className="flex items-center justify-between mb-4 bg-[#F37021]/5 border border-[#F37021]/20 p-3 rounded-lg">
                                <span className="text-sm font-bold text-[#F37021] uppercase">Pago Inicial (Recibido)</span>
                                <div className="text-right">
                                    <span className="block font-black text-lg text-[#F37021]">{formatCurrency(data.creditDetails.initialPaymentUSD, 'USD')}</span>
                                    <span className="block text-xs font-semibold text-[#F37021]/70">
                                        Equivalente: {formatCurrency(initialBs, 'VES')}
                                    </span>
                                </div>
                            </div>

                            {/* Installments Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {data.creditDetails.installments.map((inst) => (
                                    <div key={inst.number} className="flex flex-col items-center justify-center border border-gray-100 rounded-lg p-3 shadow-sm break-inside-avoid">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Cuota {inst.number}</span>
                                        <span className="text-sm font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded mb-1 w-full text-center">
                                            {inst.date}
                                        </span>
                                        <span className="text-base font-bold text-[#00549F]">
                                            {formatCurrency(inst.amountUSD, 'USD')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- FOOTER --- */}
            {/* Added mt-auto to push to bottom of container (page) */}
            <div className="mt-auto w-full text-center py-6 border-t border-gray-100 bg-white break-inside-avoid">
                <p className="font-bold text-[#00549F] text-sm mb-1">¡Gracias por preferir a ACI Movilnet!</p>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    Por favor conserve este recibo para efectos de garantía. 
                    Los cambios se realizan únicamente dentro de los 7 días hábiles siguientes a la compra con el empaque original.
                </p>
            </div>
        </div>
    );
};

export default Invoice;