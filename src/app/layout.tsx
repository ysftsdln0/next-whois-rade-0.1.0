import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://whois.rade.com.tr'),
  title: 'RADE WHOIS Sorgulama',
  description: 'Hızlı ve güvenilir domain WHOIS sorgulama hizmeti',
  authors: [{ name: 'Yusuf Efe Taşdelen' }],
  icons: {
    icon: [
      { url: '/whois-logo.png', type: 'image/png' },
      { url: '/whois-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/whois-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/whois-logo.png',
    apple: '/whois-logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'RADE WHOIS Sorgulama',
    description: 'Hızlı ve güvenilir domain WHOIS sorgulama hizmeti',
    type: 'website',
    images: [{ url: '/whois-logo.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="font-sans bg-white text-gray-900 antialiased" suppressHydrationWarning>
        <div className="noise-bg min-h-screen">
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
