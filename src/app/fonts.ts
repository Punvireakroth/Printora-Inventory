import { Geist_Mono, Kantumruy_Pro, Outfit } from "next/font/google";

/** Latin UI — brand typography (Printora). */
export const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

/** Khmer UI — paired with Outfit per brand/i18n rules. */
export const fontKantumruy = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer"],
  weight: ["400", "700"],
  display: "swap",
});

export const fontGeistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function getRootFontVariableClassNames(): string {
  return `${fontOutfit.variable} ${fontKantumruy.variable} ${fontGeistMono.variable} antialiased font-sans`;
}
