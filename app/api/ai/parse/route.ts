import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM_INSTRUCTION = `Você é o AgroCusto AI, um assistente especializado em gestão de custos agrícolas.
Sua tarefa é extrair informações de mensagens de texto, áudio ou imagens (recibos) e transformá-las em um formato JSON estruturado.

Campos obrigatórios:
- valor (número decimal)
- categoria (Diesel, Semente, Fertilizante, Mão de Obra, Manutenção, Outros)
- talhao_nomes (ARRAY de nomes de talhões mencionados, ex: ["Talhão 01", "Talhão 02"]. Se for apenas um, coloque em um array unitário)
- cultura (identifique a cultura: Soja, Milho, Trigo, etc. Se for semente, é obrigatório)
- safra (identifique a safra, ex: "24/25", "25/26")
- descricao (resumo do gasto)

Regras Críticas:
1. Se o usuário mencionar múltiplos talhões (ex: "talhão 1 e 2"), identifique ambos no array talhao_nomes.
2. Se o usuário não especificar se é para um talhão ou para a fazenda toda, defina needsConfirmation como true.
3. Se um talhão mencionado não existir na lista conhecida, defina fieldExists como false para esse talhão.
4. Sempre retorne APENAS o JSON.

Formato de Saída:
{
  "valor": number,
  "categoria": string,
  "talhao_nomes": string[],
  "fieldExists": boolean,
  "cultura": string | null,
  "safra": string | null,
  "descricao": string,
  "needsConfirmation": boolean,
  "missingContext": string | null
}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const { input, imageBase64 } = await req.json();

  const parts: any[] = [{ text: input || 'Analise este recibo e extraia os dados de custo.' }];
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.split(',')[1],
      },
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return NextResponse.json(result);
  } catch (err) {
    console.error('AI Error:', err);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
