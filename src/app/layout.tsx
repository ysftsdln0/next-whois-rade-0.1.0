import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WHOIS — Domain Intelligence',
  description: 'Minimal, fast, and reliable WHOIS lookup service with parallel API queries',
  keywords: ['whois', 'domain', 'lookup', 'dns', 'registry', 'domain intelligence'],
  authors: [{ name: 'WHOIS Service' }],
  openGraph: {
    title: 'WHOIS — Domain Intelligence',
    description: 'Minimal, fast, and reliable WHOIS lookup service',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <div className="noise-bg min-h-screen">
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
