import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Важно для PWA, чтобы инпуты не зумились на iOS
};

export const metadata: Metadata = {
  title: 'СТРОИК | Платформа для строителей',
  description: 'Поиск работы и заказов в строительстве с поддержкой ИИ',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning нужен для корректной работы next-themes
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
