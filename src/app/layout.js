import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers"; // 1. Import Providers
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Expert Portal | Mindnamo",
  description: "Manage your expert profile, appointments, and revenue.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col`}
      >
        {/* 2. Wrap children with Providers */}
        <Providers>
          {children}
        </Providers>
        
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}