import React from 'react';
import { SaleData, PaymentMethod } from '../types';
import { COMPANY_INFO } from '../constants';
import { formatCurrency } from '../utils/finance';

interface InvoiceProps {
    data: SaleData;
}

const Invoice: React.FC<InvoiceProps> = ({ data }) => {
    return (
        <div id="printable-area" className="bg-white text-gray-800 hidden print:block w-full max-w-[210mm] mx-auto p-8 relative">
            <style>
                {`
                @media print {
                    @page { margin: 10mm; size: auto; }
                    body { -webkit-print-color-adjust: exact; }
                }
                `}
            </style>
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                {/* Logo & Company Info Left */}
                <div>
                    <img src={COMPANY_INFO.logoUrl} alt="Movilnet" className="h-16 mb-2 object-contain" />
                    <h1 className="text-xl font-bold text-[#00549F]">{COMPANY_INFO.name}</h1>
                    <p className="text-sm text-gray-600 font-medium">{COMPANY_INFO.address}</p>
                    <p className="text-sm text-gray-600">Tel: {COMPANY_INFO.phone}</p>
                </div>

                {/* Receipt Details Right */}
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-[#F37021] mb-2 uppercase tracking-wide">RECIBO DE VENTA</h2>
                    <div className="text-sm text-gray-600">
                        <p className="mb-1"><span className="font-semibold">Fecha:</span> {new Date(data.date).toLocaleDateString('es-VE')} {new Date(data.date).toLocaleTimeString('es-VE')}</p>
                        <p>
                            <span className="font-semibold">ID Venta:</span> 
                            {/* Use specific ID if available (PTV-XXX), otherwise fallback to date-based */}
                            <span className="font-mono font-bold ml-1 text-[#00549F]">
                                {data.id ? data.id : data.date.replace(/\D/g,'').slice(0, 10)}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Orange Separator */}
            <div className="w-full h-0.5 bg-[#F37021] mb-6"></div>

            {/* Client Info Grid - Matches screenshot layout but excludes Exchange Rate */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-8 text-sm">
                <div>
                    <span className="block text-gray-800 font-bold uppercase text-xs mb-1 tracking-wider">CLIENTE</span>
                    <span className="block text-gray-900 text-lg capitalize">{data.clientName}</span>
                </div>
                <div>
                    <span className="block text-gray-800 font-bold uppercase text-xs mb-1 tracking-wider">CÉDULA / RIF</span>
                    <span className="block text-gray-900 text-lg">{data.clientId}</span>
                </div>
                <div>
                    <span className="block text-gray-800 font-bold uppercase text-xs mb-1 tracking-wider">TELÉFONO</span>
                    <span className="block text-gray-900 text-lg">{data.clientPhone}</span>
                </div>
                {/* Exchange Rate Hidden as requested */}
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="text-[#00549F] text-sm border-b border-gray-200">
                        <th className="text-left py-2 font-bold w-1/2">Descripción / IMEI</th>
                        <th className="text-center py-2 font-bold">Cant.</th>
                        <th className="text-right py-2 font-bold">Precio Unit.</th>
                        <th className="text-right py-2 font-bold">Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {data.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-50">
                            <td className="py-3 pr-4">
                                <div className="font-bold text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{item.code}</div>
                            </td>
                            <td className="text-center py-3 align-top">{item.quantity}</td>
                            <td className="text-right py-3 align-top">{formatCurrency(item.priceUSD, 'USD')}</td>
                            <td className="text-right py-3 align-top font-medium">{formatCurrency(item.priceUSD * item.quantity, 'USD')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Payment & Totals Section */}
            <div className="flex justify-between items-start mb-8">
                {/* Left: Payment Method */}
                <div className="w-1/2">
                    <h3 className="font-bold text-[#00549F] mb-1">Forma de Pago</h3>
                    <p className="text-lg text-gray-800">
                        {data.paymentMethod} 
                        {data.paymentMethod === PaymentMethod.CASH && data.cashMethod && (
                            <span className="block text-sm font-medium text-[#F37021] mt-1">{data.cashMethod}</span>
                        )}
                    </p>
                    
                    {data.paymentMethod === PaymentMethod.CREDIT && data.creditDetails && (
                         <p className="text-sm text-gray-500 mt-1">
                             Financiamiento vía: <span className="font-semibold text-[#F37021]">{data.creditDetails.provider}</span>
                         </p>
                    )}

                    {data.observations && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 w-3/4">
                            <p className="text-xs font-bold text-gray-500 uppercase">Observaciones</p>
                            <p className="text-sm italic text-gray-700">{data.observations}</p>
                        </div>
                    )}
                </div>
                
                {/* Right: Totals */}
                <div className="w-1/3 text-right">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">Total USD:</span>
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalUSD, 'USD')}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 pt-2 border-t border-gray-200">
                        <span className="font-medium">Total Bs:</span>
                        <span className="text-xl font-bold">{formatCurrency(data.totalBs, 'VES')}</span>
                    </div>
                </div>
            </div>

            {/* Credit Schedule Table (Only if Credit) */}
            {data.paymentMethod === PaymentMethod.CREDIT && data.creditDetails && (
                <div className="mb-8 mt-4 bg-gray-50 p-4 rounded border border-gray-100">
                    <h4 className="text-[#00549F] font-bold text-sm mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">
                        Cronograma de Pagos ({data.creditDetails.provider})
                    </h4>
                    
                    {/* Initial Payment */}
                    <div className="flex justify-between items-center mb-3 bg-white p-2 border border-gray-100 rounded">
                        <span className="font-bold text-sm">Inicial (Pagada Hoy):</span>
                        <span className="font-bold text-lg text-[#F37021]">{formatCurrency(data.creditDetails.initialPaymentUSD, 'USD')}</span>
                    </div>

                    {/* Installments Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {data.creditDetails.installments.map((inst) => (
                            <div key={inst.number} className="bg-white p-2 rounded border border-gray-200 text-center">
                                <div className="text-[10px] text-gray-500 font-bold uppercase">Cuota {inst.number}</div>
                                <div className="text-sm font-semibold text-gray-800 my-1">{inst.date}</div>
                                <div className="text-sm font-bold text-[#00549F]">{formatCurrency(inst.amountUSD, 'USD')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full text-center text-xs text-gray-500 py-6 border-t border-gray-100">
                <p className="font-medium text-gray-600">Gracias por su compra en ACI Movilnet</p>
                <p>Conserve este recibo para cualquier reclamo o garantía.</p>
            </div>
        </div>
    );
};

export default Invoice;