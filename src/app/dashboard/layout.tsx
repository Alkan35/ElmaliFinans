'use client';

import Sidebar from "@/components/Sidebar";
import CompanySelector from "@/components/CompanySelector";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import { CompanyProvider } from "@/contexts/CompanyContext";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <CompanyProvider>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full flex items-center justify-between h-20 md:h-28 px-4 md:px-8 bg-[#002366] shadow-lg z-20">
          <div className="bg-white rounded-xl md:rounded-2xl shadow flex items-center justify-center p-1 h-16 w-16 md:h-[88px] md:w-[88px]">
            <img src="/Elmali Logo.png" alt="ELMALI TECH Logo" 
                 className="h-12 md:h-20 w-auto" 
                 style={{objectFit: 'contain'}} />
          </div>
          
          {/* Company Selector */}
          <div className="flex items-center">
            <CompanySelector />
          </div>
        </header>
        <div className="flex flex-1 relative">
          <Sidebar />
          <main className="flex-1 lg:ml-60 min-h-screen bg-gray-100 transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </CompanyProvider>
  );
} 