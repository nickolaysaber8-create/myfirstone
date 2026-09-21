import type { Metadata, Viewport } from "next";
import { Archivo, DM_Mono, Karla } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-karla",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snapwrap — custom wrapped single-use cameras, Beirut",
  description:
    "Describe anything and we wrap a blank 27-exposure single-use camera in it. Printed on matte waterproof vinyl and delivered across Lebanon.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EFF1" },
    { media: "(prefers-color-scheme: dark)", color: "#111014" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${karla.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
