import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppChrome } from "@/components/layout/app-chrome";
import { StaleDeployReload } from "@/components/stale-deploy-reload";
import { ToastProvider } from "@/components/ui/toast";

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
        <StaleDeployReload />
        <ToastProvider>
          <AppChrome>{children}</AppChrome>
        </ToastProvider>
      </body>
    </html>
  );
}
