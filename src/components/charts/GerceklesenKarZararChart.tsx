import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Gelir, Gider } from '@/types/dashboard';
import { parseDate } from '@/utils/dashboardUtils';
import { displayMoney } from '@/utils/moneyUtils';

interface GerceklesenKarZararChartProps {
  gelirler: Gelir[];
  giderler: Gider[];
}

export default function GerceklesenKarZararChart({ gelirler, giderler }: GerceklesenKarZararChartProps) {
  // Grafik verisi
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const aylikGerceklesenGelir: { [key: number]: number } = {};
    const aylikGerceklesenGider: { [key: number]: number } = {};

    // Tüm aylar için başlangıç değerlerini 0 yap
    for (let i = 0; i < 12; i++) {
      aylikGerceklesenGelir[i] = 0;
      aylikGerceklesenGider[i] = 0;
    }

    // Gerçekleşen Gelirleri topla
    gelirler.forEach(gelir => {
      if (gelir.durum === 'tahsilEdildi' && gelir.odemeTarihi) {
        const date = parseDate(gelir.odemeTarihi);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          aylikGerceklesenGelir[month] += (gelir.tutar || 0);
        }
      }
    });

    // Gerçekleşen Giderleri topla
    giderler.forEach(gider => {
      if ((gider.durum === 'gerceklesen' || gider.durum === 'ödendi') && gider.odemeTarihi) {
        const date = parseDate(gider.odemeTarihi);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          aylikGerceklesenGider[month] += (gider.tutar || 0);
        }
      }
    });

    const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    // Kar/Zarar hesapla (Gelir - Gider)
    const karZararData = labels.map((_, i) => aylikGerceklesenGelir[i] - aylikGerceklesenGider[i]);

    return {
      labels,
      datasets: [
        {
          label: 'Gerçekleşen Kar/Zarar',
          data: karZararData,
          backgroundColor: karZararData.map(value => 
            value >= 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'
          ),
          borderColor: karZararData.map(value => 
            value >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
          ),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [gelirler, giderler]);

  // Grafik ayarları
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
            family: 'sans-serif',
          },
          usePointStyle: true,
          boxWidth: 8,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Aylık Gerçekleşen Kar/Zarar Durumu',
        font: {
          size: 17,
          weight: 'bold' as const,
          family: 'sans-serif',
        },
        color: '#333',
        padding: {
          bottom: 15,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: { dataset: { label?: string }; parsed: { y: number } }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = context.parsed.y;
              label += displayMoney(value);
              if (value >= 0) {
                label += ' (Kar)';
              } else {
                label += ' (Zarar)';
              }
            }
            return label;
          }
        },
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        bodyColor: '#fff',
        borderColor: 'rgba(17, 24, 39, 1)',
        borderWidth: 1,
        borderRadius: 4,
        titleFont: {
          family: 'sans-serif',
          weight: 'bold' as const,
          size: 14,
        },
        bodyFont: {
          family: 'sans-serif',
          size: 12,
        },
        padding: 10,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          borderColor: '#eee',
        },
        ticks: {
          font: {
            size: 11,
            family: 'sans-serif',
          },
          color: '#555',
        },
        title: {
          display: true,
          text: 'Aylar',
          font: {
            size: 12,
            weight: 'bold' as const,
            family: 'sans-serif',
          },
          color: '#555',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#eee',
          borderDash: [2, 2],
          borderColor: '#eee',
        },
        ticks: {
          callback: function(value: number | string) {
            return displayMoney(Number(value));
          },
          font: {
            size: 11,
            family: 'sans-serif',
          },
          color: '#555',
        },
        title: {
          display: true,
          text: 'Kar/Zarar (TL)',
          font: {
            size: 12,
            weight: 'bold' as const,
            family: 'sans-serif',
          },
          color: '#555',
        }
      }
    }
  }), []);

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
      <div className="w-full h-64 lg:h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 