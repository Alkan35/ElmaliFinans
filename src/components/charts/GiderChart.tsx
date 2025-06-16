import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Gider } from '@/types/dashboard';
import { parseDate } from '@/utils/dashboardUtils';
import { displayMoney } from '@/utils/moneyUtils';

interface GiderChartProps {
  giderler: Gider[];
}

export default function GiderChart({ giderler }: GiderChartProps) {
  // Grafik verisi
  const chartData = useMemo(() => {
    const aylikGerceklesen: { [key: number]: { [year: number]: number } } = {};
    const aylikKesinlesen: { [key: number]: { [year: number]: number } } = {};

    giderler.forEach(gider => {
      // Gerçekleşen Giderler
      if ((gider.durum === 'gerceklesen' || gider.durum === 'ödendi') && gider.odemeTarihi) {
        const date = parseDate(gider.odemeTarihi);
        if (date) {
          const year = date.getFullYear();
          const month = date.getMonth();

          if (!aylikGerceklesen[month]) {
            aylikGerceklesen[month] = {};
          }
          if (!aylikGerceklesen[month][year]) {
            aylikGerceklesen[month][year] = 0;
          }
          aylikGerceklesen[month][year] += (gider.tutar || 0);
        }
      }

      // Kesinleşen Giderler
      if (gider.durum === 'kesinlesen' && (gider.odemeBeklenenTarih || gider.sonOdemeTarihi)) {
        const dateString = gider.odemeBeklenenTarih || gider.sonOdemeTarihi;
        const date = parseDate(dateString);
        if (date) {
          const year = date.getFullYear();
          const month = date.getMonth();

          if (!aylikKesinlesen[month]) {
            aylikKesinlesen[month] = {};
          }
          if (!aylikKesinlesen[month][year]) {
            aylikKesinlesen[month][year] = 0;
          }
          aylikKesinlesen[month][year] += (gider.tutar || 0);
        }
      }
    });

    const currentYear = new Date().getFullYear();
    const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const gerceklesenDataForChart = labels.map((_, i) => aylikGerceklesen[i]?.[currentYear] || 0);
    const kesinlesenDataForChart = labels.map((_, i) => aylikKesinlesen[i]?.[currentYear] || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Gerçekleşen Gider',
          data: gerceklesenDataForChart,
          backgroundColor: 'rgba(251, 146, 60, 0.9)',
          borderColor: 'rgba(251, 146, 60, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Kesinleşen Gider',
          data: kesinlesenDataForChart,
          backgroundColor: 'rgba(165, 180, 252, 0.9)',
          borderColor: 'rgba(165, 180, 252, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [giderler]);

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
        text: 'Aylık Gider Durumu (Gerçekleşen vs Kesinleşen)',
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