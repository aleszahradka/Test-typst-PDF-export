import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typst Document Generator & Dual-Engine PDF Exporter",
  description: "Convert text or Typst code and export PDF via WebAssembly or Typst CLI engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
