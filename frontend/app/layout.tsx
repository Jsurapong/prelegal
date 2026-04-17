import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import DraftDisclaimer from "@/components/DraftDisclaimer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Prelegal — Legal Document Creator",
  description:
    "Draft legal agreements in minutes with AI. NDAs, cloud service agreements, data processing agreements, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-parchment-texture min-h-screen text-navy-dark">
        <AuthProvider>
          {children}
          <DraftDisclaimer />
        </AuthProvider>
      </body>
    </html>
  );
}
