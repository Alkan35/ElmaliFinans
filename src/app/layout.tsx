import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ToastProvider from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finans Yönetim Paneli",
  description: "Şirket finans yönetimi için geliştirilmiş panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="w-full flex items-center h-20 md:h-28 px-4 md:px-8 bg-[#002366] shadow-lg z-20">
            <div className="bg-white rounded-xl md:rounded-2xl shadow flex items-center justify-center p-1 h-16 w-16 md:h-[88px] md:w-[88px]">
              <img src="/Elmali Logo.png" alt="ELMALI TECH Logo" 
                   className="h-12 md:h-20 w-auto" 
                   style={{objectFit: 'contain'}} />
            </div>
          </header>
          <div className="flex flex-1 relative">
            <Sidebar />
            <main className="flex-1 lg:ml-60 min-h-screen bg-gray-100 transition-all duration-300">
              {children}
            </main>
          </div>
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}
