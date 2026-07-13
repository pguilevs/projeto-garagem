import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal AutoEstoque",
  description: "Portal para gestao e consulta de estoque de veiculos.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className="antialiased"
        style={{
          "--font-geist-sans": "Arial, Helvetica, sans-serif",
          "--font-geist-mono": "'Courier New', monospace",
        } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
