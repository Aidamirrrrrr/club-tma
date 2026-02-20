import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TelegramProvider } from "@/components/telegram-provider";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { TelegramBackButtonManager } from "@/components/telegram-back-button";
import { MainContent } from "@/components/main-content";

const helveticaNeue = localFont({
  src: [
    {
      path: "../../public/helveticaneuecyr_roman.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/HelveticaNeueCyr Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Клуб",
  description: "Telegram Mini App — управление мероприятиями и участниками",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${helveticaNeue.variable} antialiased`}>
        <TelegramProvider>
          <TelegramBackButtonManager />
          <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
            <DesktopSidebar />
            <div className="min-w-0 flex-1 overflow-x-hidden lg:overflow-y-auto">
              <MainContent>{children}</MainContent>
            </div>
          </div>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
