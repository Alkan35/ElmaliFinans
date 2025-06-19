import { DashboardStats } from '@/types/dashboard';
import { displayMoney } from '@/utils/moneyUtils';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export default function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const statsCards = [
    {
      title: 'Toplam Gelir (Gerçekleşen)',
      value: stats.totalGerceklesenGelir,
      color: 'green',
      bgGradient: 'from-green-500/10 via-emerald-500/10 to-teal-500/10',
      borderColor: 'border-green-200/30',
      textColor: 'text-green-600',
      iconBg: 'bg-green-500/10',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      title: 'Toplam Gider (Gerçekleşen)',
      value: stats.totalGerceklesenGider,
      color: 'red',
      bgGradient: 'from-red-500/10 via-pink-500/10 to-rose-500/10',
      borderColor: 'border-red-200/30',
      textColor: 'text-red-600',
      iconBg: 'bg-red-500/10',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'Güncel Bakiye',
      value: stats.guncelBakiye,
      color: stats.guncelBakiye >= 0 ? 'blue' : 'red',
      bgGradient: stats.guncelBakiye >= 0 ? 'from-blue-500/10 via-indigo-500/10 to-purple-500/10' : 'from-red-500/10 via-pink-500/10 to-rose-500/10',
      borderColor: stats.guncelBakiye >= 0 ? 'border-blue-200/30' : 'border-red-200/30',
      textColor: stats.guncelBakiye >= 0 ? 'text-blue-600' : 'text-red-600',
      iconBg: stats.guncelBakiye >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10',
      icon: (
        <svg className={`w-6 h-6 ${stats.guncelBakiye >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
        </svg>
      )
    },
    {
      title: 'Beklenen Gelir (Kesinleşen)',
      value: stats.totalKesinlesenGelir,
      color: 'yellow',
      bgGradient: 'from-yellow-500/10 via-amber-500/10 to-orange-500/10',
      borderColor: 'border-yellow-200/30',
      textColor: 'text-yellow-600',
      iconBg: 'bg-yellow-500/10',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Beklenen Gider (Kesinleşen)',
      value: stats.totalKesinlesenGider,
      color: 'orange',
      bgGradient: 'from-orange-500/10 via-amber-500/10 to-yellow-500/10',
      borderColor: 'border-orange-200/30',
      textColor: 'text-orange-600',
      iconBg: 'bg-orange-500/10',
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Beklenen Durum',
      value: stats.beklenenDurum,
      color: stats.beklenenDurum >= 0 ? 'purple' : 'red',
      bgGradient: stats.beklenenDurum >= 0 ? 'from-purple-500/10 via-indigo-500/10 to-blue-500/10' : 'from-red-500/10 via-pink-500/10 to-rose-500/10',
      borderColor: stats.beklenenDurum >= 0 ? 'border-purple-200/30' : 'border-red-200/30',
      textColor: stats.beklenenDurum >= 0 ? 'text-purple-600' : 'text-red-600',
      iconBg: stats.beklenenDurum >= 0 ? 'bg-purple-500/10' : 'bg-red-500/10',
      icon: (
        <svg className={`w-6 h-6 ${stats.beklenenDurum >= 0 ? 'text-purple-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Gerçekleşen Veriler */}
      <div>
        <div className="flex items-center mb-4">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Gerçekleşen Durum</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {statsCards.slice(0, 3).map((card, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${card.bgGradient} border ${card.borderColor} rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${card.iconBg} rounded-xl`}>
                  {card.icon}
                </div>
                <div className={`px-3 py-1 bg-white/50 rounded-full text-xs font-medium ${card.textColor}`}>
                  Gerçekleşen
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{card.title}</h3>
                <p className={`text-2xl lg:text-3xl font-bold ${card.textColor}`}>
                  {displayMoney(card.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beklenen Veriler */}
      <div>
        <div className="flex items-center mb-4">
          <div className="p-2 bg-yellow-100 rounded-lg mr-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Beklenen Durum</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {statsCards.slice(3).map((card, index) => (
            <div
              key={index + 3}
              className={`bg-gradient-to-r ${card.bgGradient} border ${card.borderColor} rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${card.iconBg} rounded-xl`}>
                  {card.icon}
                </div>
                <div className={`px-3 py-1 bg-white/50 rounded-full text-xs font-medium ${card.textColor}`}>
                  Beklenen
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{card.title}</h3>
                <p className={`text-2xl lg:text-3xl font-bold ${card.textColor}`}>
                  {displayMoney(card.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 