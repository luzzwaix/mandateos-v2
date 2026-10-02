import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MandateOS — Recursive capital authority",
  description:
    "Don't give agents wallets. Give them mandates. Control capital, revoke branches, and coordinate agent work on Solana.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
