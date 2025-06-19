'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCompany, Company } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { FiChevronDown, FiBriefcase, FiCheck, FiSettings } from 'react-icons/fi';

export default function CompanySelector() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { user } = useAuth();
  const {
    currentCompany,
    userCompanies,
    setCurrentCompany,
    getUserCompanies,
    loading
  } = useCompany();

  // Kullanıcı şirketlerini yükle
  useEffect(() => {
    if (user && userCompanies.length === 0) {
      getUserCompanies(user);
    }
  }, [user, userCompanies.length, getUserCompanies]);

  const handleCompanySelect = (company: Company) => {
    setCurrentCompany(company);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-white">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Company Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-3 text-white transition-all duration-300 border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <div className="p-1.5 bg-white/20 rounded-lg">
          <FiBriefcase className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-wide">
          {currentCompany?.name || 'Şirket Seçiniz'}
        </span>
        <FiChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-72 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden">
          <div className="py-3">
            {/* Company List Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Şirketleriniz
              </h3>
            </div>
            
            {/* Company List */}
            <div className="py-2">
              {userCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors duration-200">
                      <FiBriefcase className="h-4 w-4 text-white/80" />
                    </div>
                    <span className="text-sm font-medium text-white">{company.name}</span>
                  </div>
                  {currentCompany?.id === company.id && (
                    <div className="p-1 bg-emerald-500/20 rounded-full">
                      <FiCheck className="h-3 w-3 text-emerald-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-2"></div>

            {/* Şirket Yönetimi Linki */}
            <Link 
              href="/dashboard/ayarlar/sirket-yonetimi"
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-1.5 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-200">
                <FiSettings className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-white">Şirket Yönetimi</span>
            </Link>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 