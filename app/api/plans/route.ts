import { NextResponse } from 'next/server';

export async function GET() {
  const plans = [
    { id: 'monthly', name: 'Plano Mensal', price: 50, period: 'monthly' },
    { id: 'semiannual', name: 'Plano Semestral', price: 270, period: 'semiannual', savings: '10% OFF' },
    { id: 'annual', name: 'Plano Anual', price: 480, period: 'annual', savings: '20% OFF' },
  ];
  return NextResponse.json(plans);
}
