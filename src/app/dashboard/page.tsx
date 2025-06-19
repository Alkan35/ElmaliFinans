'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Chart.js için gerekli bileşenleri kaydedin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Utils
import { calculateDashboardStats } from '@/utils/dashboardUtils';

// Hooks
import { useCompanyDashboardData } from '@/hooks/useCompanyData';
import { useCompany } from '@/contexts/CompanyContext';

// Components
import DashboardStatsComponent from '@/components/dashboard/DashboardStats';
import GelirChart from '@/components/charts/GelirChart';
import GiderChart from '@/components/charts/GiderChart';
import GerceklesenChart from '@/components/charts/GerceklesenChart';
import KesinlesenChart from '@/components/charts/KesinlesenChart';
import AylikGiderAltBasliklarChart from '@/components/charts/AylikGiderAltBasliklarChart';
import GerceklesenKarZararChart from '@/components/charts/GerceklesenKarZararChart';
import KesinlesenKarZararChart from '@/components/charts/KesinlesenKarZararChart';

export default function Dashboard() {
  const { currentCompany } = useCompany();
  const { gelirler, giderler, loading, error } = useCompanyDashboardData();

  // Dashboard istatistiklerini hesapla
  const stats = useMemo(() => {
    return calculateDashboardStats(gelirler, giderler);
  }, [gelirler, giderler]);

  if (!currentCompany) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Şirket Seçiniz</h3>
            <p className="text-gray-600">Devam etmek için header&apos;dan bir şirket seçiniz veya yeni şirket oluşturunuz.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">
                Dashboard
              </h1>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{currentCompany.name}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Veriler yükleniyor...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Hata: {error}</div>
          ) : (
            <div className="p-4 lg:p-6">
              {/* Dashboard İstatistikleri */}
              <DashboardStatsComponent stats={stats} />

              {/* Grafik Alanı */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mt-6 lg:mt-8">
                {/* Gelir ve Gider Grafikleri */}
                <GelirChart gelirler={gelirler} />
                <GiderChart giderler={giderler} />

                {/* Gerçekleşen Grafikleri */}
                <GerceklesenChart gelirler={gelirler} giderler={giderler} />
                <GerceklesenKarZararChart gelirler={gelirler} giderler={giderler} />

                {/* Kesinleşen Grafikleri */}
                <KesinlesenChart gelirler={gelirler} giderler={giderler} />
                <KesinlesenKarZararChart gelirler={gelirler} giderler={giderler} />

                {/* Aylık Gider Alt Başlıkları Grafiği */}
                <AylikGiderAltBasliklarChart giderler={giderler} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 