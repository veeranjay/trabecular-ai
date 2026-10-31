import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Trabecular — Biomechanical workspace",
  description:
    "Mandibular plate design, numerical verification, and geometric review.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
