import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RADE WHOIS Sorgulama',
  description: 'Hızlı ve güvenilir domain WHOIS sorgulama hizmeti',
  authors: [{ name: 'Yusuf Efe Taşdelen' }],
  openGraph: {
    title: 'RADE WHOIS Sorgulama',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="font-sans bg-black text-white antialiased">
        <div className="noise-bg min-h-screen">
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
