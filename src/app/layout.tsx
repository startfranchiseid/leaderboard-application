import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-family", // match variable used in css
});

export const metadata: Metadata = {
  title: "Leaderboard Application",
  description: "Real-time Leaderboard for Expo Franchise deals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
