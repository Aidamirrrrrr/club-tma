import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TelegramProvider } from "@/components/telegram-provider";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { TelegramBackButtonManager } from "@/components/telegram-back-button";
import { MainContent } from "@/components/main-content";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Клуб",
  description: "Telegram Mini App — управление мероприятиями и участниками",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TelegramProvider>
          <TelegramBackButtonManager />
          <div className="flex min-h-screen">
            <DesktopSidebar />
            <MainContent>{children}</MainContent>
          </div>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
