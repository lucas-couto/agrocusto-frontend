import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, from, type } = await req.json();
  console.log(`WhatsApp Message from ${from}: ${text || type}`);

  return NextResponse.json({
    success: true,
    message: 'Processando sua mensagem com AgroCusto AI...',
    data: {
      valor: 1200,
      categoria: 'Diesel',
      descricao: 'Abastecimento via WhatsApp',
      talhao_id: 1,
    },
  });
}
