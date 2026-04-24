import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date().toISOString();
  const quotes = [
    { id: '1', commodity: 'Soja (Paranaguá)', price: 135.5, unit: 'sc 60kg', change: 1.2, lastUpdate: now, source: 'CEPEA' },
    { id: '2', commodity: 'Milho (Campinas)', price: 62.8, unit: 'sc 60kg', change: -0.5, lastUpdate: now, source: 'CEPEA' },
    { id: '3', commodity: 'Trigo (PR)', price: 1280.0, unit: 'ton', change: 0.0, lastUpdate: now, source: 'CEPEA' },
    { id: '4', commodity: 'Boi Gordo (SP)', price: 235.4, unit: '@', change: 0.8, lastUpdate: now, source: 'B3' },
  ];
  return NextResponse.json(quotes);
}
