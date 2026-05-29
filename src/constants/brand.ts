import type { Metadata } from "next";

/** Horizontal logo in `public/logo.png` (2558×741). */
export const BRAND_LOGO_PATH = "/logo.png";
export const BRAND_LOGO_ASPECT = 2558 / 741;

export const BRAND_THEME_COLOR = "#EB1C24";

export const siteIcons: NonNullable<Metadata["icons"]> = {
  icon: [
    {
      url: "/favicon/favicon-16x16.png",
      sizes: "16x16",
      type: "image/png",
    },
    {
      url: "/favicon/favicon-32x32.png",
      sizes: "32x32",
      type: "image/png",
    },
    { url: "/favicon.ico", sizes: "any" },
  ],
  apple: "/favicon/apple-touch-icon.png",
  shortcut: "/favicon.ico",
};

export const siteManifestPath = "/favicon/site.webmanifest";
