import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Gelir } from '@/types/dashboard';
import { parseDate } from '@/utils/dashboardUtils';
import { displayMoney } from '@/utils/moneyUtils';

interface GelirChartProps {
  gelirler: Gelir[];
}

export default function GelirChart({ gelirler }: GelirChartProps) {
  // Grafik verisi
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const aylikGerceklesen: { [key: number]: number } = {};
    const aylikKesinlesen: { [key: number]: number } = {};

    // Tüm aylar için başlangıç değerlerini 0 yap
    for (let i = 0; i < 12; i++) {
      aylikGerceklesen[i] = 0;
      aylikKesinlesen[i] = 0;
    }

    gelirler.forEach(gelir => {
      // Gerçekleşen Gelirler
      if (gelir.durum === 'tahsilEdildi' && gelir.odemeTarihi) {
        const date = parseDate(gelir.odemeTarihi);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          aylikGerceklesen[month] += (gelir.tutar || 0);
        }
      }

      // Kesinleşen Gelirler
      if (gelir.durum === 'kesinlesen' && (gelir.odemeBeklenenTarih || gelir.sonOdemeTarihi)) {
        const date = parseDate(gelir.odemeBeklenenTarih || gelir.sonOdemeTarihi);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          aylikKesinlesen[month] += (gelir.tutar || 0);
        }
      }
    });

    const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    return {
      labels,
      datasets: [
        {
          label: 'Gerçekleşen Gelir',
          data: labels.map((_, i) => aylikGerceklesen[i]),
          backgroundColor: 'rgba(96, 165, 250, 0.9)',
          borderColor: 'rgba(96, 165, 250, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Kesinleşen Gelir',
          data: labels.map((_, i) => aylikKesinlesen[i]),
          backgroundColor: 'rgba(52, 211, 163, 0.9)',
          borderColor: 'rgba(52, 211, 163, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [gelirler]);

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
        text: 'Aylık Gelir Durumu (Gerçekleşen vs Kesinleşen)',
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
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += displayMoney(context.parsed.y);
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
          callback: function(value: any) {
            return displayMoney(value);
          },
          font: {
            size: 11,
            family: 'sans-serif',
          },
          color: '#555',
        },
        title: {
          display: true,
          text: 'Tutar (TL)',
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