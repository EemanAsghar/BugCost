import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BugCost — Every Bug Has a Price",
  description:
    "Autonomous Revenue Impact Investigation Platform. Powered by Coral + Claude.",
  openGraph: {
    title: "BugCost — Every Bug Has a Price",
    description: "See exactly how much each bug costs your business.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
