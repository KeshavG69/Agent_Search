import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navigation from "@/components/AI_Virtual_Assistant_Nvidia/Navigation/Navigation";
import FloatingButtons from "@/components/FloatingButton/FloatingButtons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nvidia POC - GenAI Protos",
  description: "Developed by the Nvidia GenAI Protos team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Navigation/>
        {children}
        <FloatingButtons/>
      </body>
    </html>
  );
}
