import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QORE Interview Screening",
  description: "AI-powered interview screening platform for efficient candidate assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}
