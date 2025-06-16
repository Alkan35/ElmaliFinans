import { DashboardStats } from '@/types/dashboard';
import { displayMoney } from '@/utils/moneyUtils';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export default function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  return (
    <>
      {/* Özet Kartlar - İlk Satır */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Toplam Gelir (Gerçekleşen) Kartı */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm lg:text-base font-medium text-gray-600 mb-2">Toplam Gelir (Gerçekleşen)</h3>
          <p className="text-xl lg:text-2xl font-bold text-green-600">{displayMoney(stats.totalGerceklesenGelir)}</p>
        </div>

        {/* Toplam Gider (Gerçekleşen) Kartı */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm lg:text-base font-medium text-gray-600 mb-2">Toplam Gider (Gerçekleşen)</h3>
          <p className="text-xl lg:text-2xl font-bold text-red-600">{displayMoney(stats.totalGerceklesenGider)}</p>
        </div>

        {/* Güncel Bakiye Kartı */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm lg:text-base font-medium text-gray-600 mb-2">Güncel Bakiye</h3>
          <p className={`text-xl lg:text-2xl font-bold ${stats.guncelBakiye >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {displayMoney(stats.guncelBakiye)}
          </p>
        </div>
      </div>

      {/* Özet Kartlar - İkinci Satır */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Toplam Beklenen Gelir (Kesinleşen) Kartı */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm lg:text-base font-medium text-gray-600 mb-2">Toplam Beklenen Gelir (Kesinleşen)</h3>
          <p className="text-xl lg:text-2xl font-bold text-yellow-600">{displayMoney(stats.totalKesinlesenGelir)}</p>
        </div>

        {/* Toplam Beklenen Gider (Kesinleşen) Kartı */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-sm lg:text-base font-medium text-gray-600 mb-2">Toplam Beklenen Gider (Kesinleşen)</h3>
          <p className="text-xl lg:text-2xl font-bold text-orange-600">{displayMoney(stats.totalKesinlesenGider)}</p>
        </div>

        {/* Beklenen Durum Kartı */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm lg:text-base font-medium text-gray-600 mb-2">Beklenen Durum</h3>
          <p className={`text-xl lg:text-2xl font-bold ${stats.beklenenDurum >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            {displayMoney(stats.beklenenDurum)}
          </p>
        </div>
      </div>
    </>
  );
} 