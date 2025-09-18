import './globals.css';
import { Inter } from 'next/font/google';
import LandingNavbar from '@/components/LandingNavbar';
import RootClientLayout from './RootClientLayout'; // Import the client wrapper

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'DeFi Bank | Secure HBAR Transfers on Hedera Testnet',
  description: 'Secure HBAR transfers, group payments, and smart savings on the Hedera Testnet',
  keywords: 'crypto, payments, Hedera, HBAR, DeFi, secure transfers, group payments',
  authors: [{ name: 'DeFi Bank' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  );
}
