import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Boeking — Seamless WhatsApp Reservations Powered by AI',
  description: 'Give your restaurant a 24/7 AI booking assistant on WhatsApp. Customers reserve tables instantly, reminders go out automatically, and your staff dashboard stays perfectly in sync.',
  keywords: 'restaurant booking system South Africa, WhatsApp restaurant reservations, AI booking assistant, restaurant management software Cape Town',
  openGraph: {
    title: 'Boeking — Seamless WhatsApp Reservations Powered by AI',
    description: 'Give your restaurant a 24/7 AI booking assistant on WhatsApp.',
    url: 'https://www.boeking.co.za',
    siteName: 'Boeking',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boeking — WhatsApp Restaurant Reservations',
    description: 'AI-powered restaurant bookings on WhatsApp for South African restaurants.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.boeking.co.za',
  },
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
