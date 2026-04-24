import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Kinetic',
  description: 'Calisthenics training tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased" style={{ background: '#07051a', color: '#ffffff' }}>
        {/* Global purple orb — top-center radial glow */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100vw',
            maxWidth: 1000,
            height: '65vh',
            background: 'radial-gradient(ellipse at 50% -5%, rgba(124,90,246,0.18) 0%, rgba(90,60,200,0.08) 40%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'orb-drift 8s ease-in-out infinite',
          }}
        />
        <Sidebar />
        <main className="min-h-dvh relative z-[1]">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
