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
        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-white transition-colors duration-200"
      >
        <FiBriefcase className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentCompany?.name || 'Şirket Seçiniz'}
        </span>
        <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="py-2">
            {/* Company List */}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Şirketleriniz
            </div>
            
            {userCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center space-x-2">
                  <FiBriefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{company.name}</span>
                </div>
                {currentCompany?.id === company.id && (
                  <FiCheck className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Şirket Yönetimi Linki */}
            <Link 
              href="/dashboard/ayarlar/sirket-yonetimi"
              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              <FiSettings className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Şirket Yönetimi</span>
            </Link>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 