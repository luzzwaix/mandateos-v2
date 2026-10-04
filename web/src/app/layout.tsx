import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/anton/latin-400.css";
import WorldShell from "@/components/world-shell";
import "./globals.css";
import "./experience.css";
import "./loom.css";

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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <WorldShell>{children}</WorldShell>
      </body>
    </html>
  );
}
