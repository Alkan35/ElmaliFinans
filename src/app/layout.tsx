import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
          <header className="w-full flex items-center h-28 px-8 bg-[#002366] shadow-lg z-20">
            <div className="bg-white rounded-2xl shadow flex items-center justify-center p-1" style={{height: '88px', width: '88px'}}>
              <img src="/Elmali Logo.png" alt="ELMALI TECH Logo" className="h-24 w-auto" style={{objectFit: 'contain'}} />
            </div>
          </header>
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen bg-gray-100">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
