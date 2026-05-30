import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BugCost — Every Bug Has a Price",
  description:
    "Autonomous Revenue Impact Investigation Platform. Powered by Coral + Claude.",
  icons: {
    icon: "/BugCost-Favicon.png",
    apple: "/BugCost-Favicon.png",
  },
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
    <ClerkProvider
      signInUrl="/auth"
      signUpUrl="/auth"
      appearance={{
        variables: {
          colorPrimary: "#ff3b5c",
          colorBackground: "#0d0d1a",
          colorInputBackground: "#111120",
          colorInputText: "#e8e8f5",
          colorText: "#e8e8f5",
          colorTextSecondary: "#52527a",
          colorNeutral: "#52527a",
          borderRadius: "0.6rem",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        },
      }}
    >
      <html lang="en" className={inter.className}>
        <body className="min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
