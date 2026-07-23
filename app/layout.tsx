import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Margin — My Notes",
  description: "A private, focused PDF shelf for studying anywhere.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
