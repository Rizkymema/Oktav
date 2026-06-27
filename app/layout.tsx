import type {Metadata, Viewport} from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Hermes Agent - Control Center Workspace',
  description: 'Beranda dan dashboard Hermes Agent untuk memantau project, task, runtime, dan kontrol operator dari satu workspace modern.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-[#080C14] text-[#F1F5F9] antialiased min-h-screen font-sans selection:bg-indigo-500/20 selection:text-indigo-400" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
