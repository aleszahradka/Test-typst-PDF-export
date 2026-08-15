import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generátor dokumentů Typst & Export do PDF",
  description: "Převod textu nebo kódu Typst a export do PDF pomocí nástroje Typst CLI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
