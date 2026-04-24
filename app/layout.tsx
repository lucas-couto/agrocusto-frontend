import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgroCusto',
  description:
    'Assistente Agrônomo Virtual para gestão de custos e lucratividade na produção de grãos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
