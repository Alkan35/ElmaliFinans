'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, Query, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCompany } from '@/contexts/CompanyContext';

// Modular table components
import TumGiderlerTable from './gidertable/TumGiderlerTable';
import GerceklesenGiderlerTable from './gidertable/GerceklesenGiderlerTable';
import KesinlesenGiderlerTable from './gidertable/KesinlesenGiderlerTable';

interface Gider {
  id: string;
  ad?: string;
  baslik?: string;
  altBaslik?: string;
  tarih?: string;
  tutar?: number;
  durum?: string;
  tur?: string;
  maasGunu?: number;
  odemeTarihi?: string;
  kalanAy?: number;
  toplamAy?: number;
  sonOdemeTarihi?: string;
  odendi?: boolean;
  createdAt?: Timestamp;
  parentId?: string;
}

export default function GiderlerTable() {
  const { currentCompany } = useCompany();
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tumu');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy] = useState('createdAt');
  const [filters] = useState<{
    expectedMonth: number | null;
    paidMonth: number | null;
    status: string | null;
    type: string | null;
  }>({
    expectedMonth: null,
    paidMonth: null,
    status: null,
    type: null
  });

  // Company-aware veri çekme
  useEffect(() => {
    if (!currentCompany) {
      setGiderler([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Company-specific collection
    const collectionName = `giderler-${currentCompany.id}`;
    let giderQuery: Query<DocumentData>;

    try {
      if (sortBy === 'createdAt') {
        giderQuery = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      } else if (sortBy === 'odemeTarihi') {
        giderQuery = query(collection(db, collectionName), orderBy('odemeTarihi', 'desc'));
      } else if (sortBy === 'sonOdemeTarihi') {
        giderQuery = query(collection(db, collectionName), orderBy('sonOdemeTarihi', 'asc'));
      } else {
        giderQuery = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      }

      const unsubscribe = onSnapshot(giderQuery, (snapshot) => {
        try {
          const giderlerData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Gider[];

          console.log(`GiderlerTable - onSnapshot: Fetched data count for ${currentCompany.name}:`, giderlerData.length);
          console.log("GiderlerTable - onSnapshot: First 5 IDs:", giderlerData.slice(0, 5).map(g => g.id));

          setGiderler(giderlerData);
          setLoading(false);
        } catch (err) {
          console.error(`Error fetching or filtering giderler for ${currentCompany.name}:`, err);
          setError("Giderler yüklenirken veya filtrelenirken hata oluştu.");
          setLoading(false);
        }
      }, (err) => {
        console.error(`Firestore listener error for ${collectionName}:`, err);
        setError(`Giderler dinlenirken hata oluştu: ${err.message}`);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up giderler listener:", err);
      setError("Giderler listener kurulurken hata oluştu.");
      setLoading(false);
    }
  }, [currentCompany, sortBy]);

  // Filtrelenmiş giderleri hesapla
  const filteredGiderler = useMemo(() => {
    if (!Array.isArray(giderler)) return [];

    let data = giderler;

    // Diğer filtreler
    if (filters.expectedMonth !== null) {
      data = data.filter(gider => {
        const date = gider.sonOdemeTarihi ? new Date(gider.sonOdemeTarihi) : null;
        return date && date.getMonth() === filters.expectedMonth;
      });
    }

    if (filters.paidMonth !== null) {
      data = data.filter(gider => {
        const date = gider.odemeTarihi ? new Date(gider.odemeTarihi) : null;
        return date && date.getMonth() === filters.paidMonth;
      });
    }

    if (filters.status) {
      if (filters.status === 'odendi') {
        data = data.filter(gider => gider.odendi === true || gider.durum === 'gerceklesen');
      } else if (filters.status === 'odenmesiGereken') {
        data = data.filter(gider => gider.odendi === false && gider.durum !== 'gerceklesen');
      }
    }

    if (filters.type) {
      data = data.filter(gider => gider.tur === filters.type);
    }

    return data;
  }, [giderler, filters]);

  // Tab'a göre filtrelenmiş giderler
  const tabFilteredGiderler = useMemo(() => {
    if (activeTab === 'gerceklesen') {
      return filteredGiderler.filter(gider => gider.durum === 'gerceklesen' || gider.odendi === true);
    } else if (activeTab === 'kesinlesen') {
      return filteredGiderler.filter(gider => gider.durum !== 'gerceklesen' && gider.odendi === false);
    }
    return filteredGiderler; // 'tumu' için tüm giderler
  }, [filteredGiderler, activeTab]);

  // Sayfa değiştiğinde currentPage'i sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Şirket yoksa gösterilecek mesaj
  if (!currentCompany) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl">
            <svg className="mx-auto h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5" />
          </svg>
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Şirket Seçiniz</h3>
            <p className="text-gray-600 leading-relaxed">Gider verilerini görüntülemek için önce bir şirket seçmeniz gerekmektedir.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading durumu
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Giderler Yükleniyor</h3>
            <p className="text-gray-600">Veriler hazırlanıyor, lütfen bekleyiniz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error durumu
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl">
            <svg className="mx-auto h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bir Hata Oluştu</h3>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yeniden Yükle
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveTable = () => {
    switch (activeTab) {
      case 'gerceklesen':
        return (
          <GerceklesenGiderlerTable
            giderler={tabFilteredGiderler}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        );
      case 'kesinlesen':
        return (
          <KesinlesenGiderlerTable
            giderler={tabFilteredGiderler}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        );
      default:
        return (
          <TumGiderlerTable
            giderler={tabFilteredGiderler}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        );
    }
  };

    return (
    <div className="space-y-8">
      {/* Company Info with Modern Design */}
      <div className="bg-gradient-to-r from-red-500/10 via-pink-500/10 to-rose-500/10 border border-red-200/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              <span className="text-red-600">{currentCompany?.name}</span> şirketi
            </h3>
            <p className="text-gray-600 text-sm">
              Gider verileri görüntüleniyor
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation with Modern Design */}
      <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="border-b border-gray-200/50 bg-gradient-to-r from-red-50/50 to-pink-50/50">
          <nav className="flex space-x-4 p-4 overflow-x-auto">
            {[
              { 
                id: 'tumu', 
                label: 'Tüm Giderler', 
                count: filteredGiderler.length,
                icon: (
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )
              },
              { 
                id: 'gerceklesen', 
                label: 'Gerçekleşen', 
                count: filteredGiderler.filter(g => g.durum === 'gerceklesen' || g.odendi === true).length,
                icon: (
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              { 
                id: 'kesinlesen', 
                label: 'Kesinleşen', 
                count: filteredGiderler.filter(g => g.durum !== 'gerceklesen' && g.odendi === false).length,
                icon: (
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                } relative flex items-center space-x-3 px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
                  activeTab === tab.id ? 'ring-2 ring-red-300 ring-offset-2 ring-offset-red-50/10' : ''
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`${
                  activeTab === tab.id ? 'bg-white/30 text-white' : 'bg-gray-200/80 text-gray-700'
                } inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors shadow-sm ml-1.5`}>
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 opacity-10"></div>
                    <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-16 h-1 bg-red-500 rounded-t-lg"></div>
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Render Active Table */}
        {renderActiveTable()}
      </div>
    </div>
  );
}