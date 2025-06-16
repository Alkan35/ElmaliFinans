import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Gelir, Gider } from '@/types/dashboard';
import { parseDate } from '@/utils/dashboardUtils';
import { displayMoney } from '@/utils/moneyUtils';

interface KesinlesenChartProps {
  gelirler: Gelir[];
  giderler: Gider[];
}

export default function KesinlesenChart({ gelirler, giderler }: KesinlesenChartProps) {
  // Grafik verisi
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const aylikKesinlesenGelir: { [key: number]: number } = {};
    const aylikKesinlesenGider: { [key: number]: number } = {};

    // Tüm aylar için başlangıç değerlerini 0 yap
    for (let i = 0; i < 12; i++) {
      aylikKesinlesenGelir[i] = 0;
      aylikKesinlesenGider[i] = 0;
    }

    // Kesinleşen Gelirleri topla
    gelirler.forEach(gelir => {
      if (gelir.durum === 'kesinlesen' && (gelir.odemeBeklenenTarih || gelir.sonOdemeTarihi)) {
        const date = parseDate(gelir.odemeBeklenenTarih || gelir.sonOdemeTarihi);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          aylikKesinlesenGelir[month] += (gelir.tutar || 0);
        }
      }
    });

    // Kesinleşen Giderleri topla
    giderler.forEach(gider => {
      if (gider.durum === 'kesinlesen' && (gider.odemeBeklenenTarih || gider.sonOdemeTarihi)) {
        const dateString = gider.odemeBeklenenTarih || gider.sonOdemeTarihi;
        const date = parseDate(dateString);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          aylikKesinlesenGider[month] += (gider.tutar || 0);
        }
      }
    });

    const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    return {
      labels,
      datasets: [
        {
          label: 'Kesinleşen Gelir',
          data: labels.map((_, i) => aylikKesinlesenGelir[i]),
          backgroundColor: 'rgba(129, 140, 248, 0.9)',
          borderColor: 'rgba(129, 140, 248, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Kesinleşen Gider',
          data: labels.map((_, i) => aylikKesinlesenGider[i]),
          backgroundColor: 'rgba(244, 114, 182, 0.9)',
          borderColor: 'rgba(244, 114, 182, 1)',
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
        text: 'Aylık Kesinleşen Durum (Gelir vs Gider)',
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