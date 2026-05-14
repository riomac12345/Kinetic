import type { Metadata } from 'next';
import { Chakra_Petch, Outfit, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const chakraPetch = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
});

const outfit = Outfit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kinetic',
  description: 'Climbing & calisthenics training tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakraPetch.variable} ${outfit.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        <Sidebar />
        <main className="main-content min-h-dvh">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
