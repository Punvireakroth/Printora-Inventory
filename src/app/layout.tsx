import type { Metadata } from "next";
import { Geist_Mono, Kantumruy_Pro, Outfit } from "next/font/google";
import "./globals.css";

const OutfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const KantumruyKhmer = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer"],
  weight: ["400", "700"],
  display: "swap",
});

const GeistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Printora Inventory",
  description: "Stock management platform for Printora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${OutfitSans.variable} ${KantumruyKhmer.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
