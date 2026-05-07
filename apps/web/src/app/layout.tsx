import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VetSystem',
  description: 'Sistema de gestión veterinaria',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-vet-50 text-vet-800 antialiased">{children}</body>
    </html>
  );
}
