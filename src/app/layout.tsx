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
  title: 'DeFi Bank | Secure Transfers, Group Payments, Savings, African Stablecoins, DEX, Loans and Escrow on Hedera Testnet',
  description: 'DeFi Bank provides Secure and protected transfers, group payments, savings, African stablecoins mint/burn, revolutionaly DEX, Loans, Escrow and Transaction history.',
  keywords: 'crypto, payments, Hedera, HBAR, DeFi, secure transfers, group payments, DEX, Loans, Escrow',
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
