import { useMemo, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Gider } from '@/types/dashboard';
import { parseDate } from '@/utils/dashboardUtils';
import { displayMoney } from '@/utils/moneyUtils';

interface AltBaslik {
  id: string;
  isim: string;
}

interface AnaBaslik {
  id: string;
  isim: string;
  altBasliklar: AltBaslik[];
}

interface AylikGiderAltBasliklarChartProps {
  giderler: Gider[];
}

// Dinamik renkler için renk paleti
const colorPalette = [
  'rgba(59, 130, 246, 0.8)',   // Blue
  'rgba(16, 185, 129, 0.8)',   // Green
  'rgba(251, 146, 60, 0.8)',   // Orange
  'rgba(239, 68, 68, 0.8)',    // Red
  'rgba(139, 92, 246, 0.8)',   // Purple
  'rgba(236, 72, 153, 0.8)',   // Pink
  'rgba(14, 165, 233, 0.8)',   // Light Blue
  'rgba(34, 197, 94, 0.8)',    // Emerald
  'rgba(245, 158, 11, 0.8)',   // Amber
  'rgba(220, 38, 127, 0.8)',   // Rose
  'rgba(124, 58, 237, 0.8)',   // Violet
  'rgba(6, 182, 212, 0.8)',    // Cyan
  'rgba(168, 85, 247, 0.8)',   // Fuchsia
  'rgba(99, 102, 241, 0.8)',   // Indigo
  'rgba(244, 63, 94, 0.8)',    // Red Pink
];

export default function AylikGiderAltBasliklarChart({ giderler }: AylikGiderAltBasliklarChartProps) {
  const [altBasliklar, setAltBasliklar] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestore'dan gider alt başlıklarını çek
  useEffect(() => {
    const fetchAltBasliklar = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'giderBasliklari'));
        const tumAltBasliklar = new Set<string>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (Array.isArray(data.altBasliklar)) {
            data.altBasliklar.forEach((alt: AltBaslik) => {
              if (alt.isim) {
                tumAltBasliklar.add(alt.isim);
              }
            });
          }
        });
        
        setAltBasliklar(Array.from(tumAltBasliklar).sort());
      } catch (error) {
        console.error('Alt başlıklar çekilirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAltBasliklar();
  }, []);

  // Grafik verisi
  const chartData = useMemo(() => {
    if (loading || altBasliklar.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const currentYear = new Date().getFullYear();
    const ayLabels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    // Her alt başlık için aylık veriler
    const aylikVeriler: { [altBaslik: string]: { [ay: number]: number } } = {};
    
    // Alt başlıkları initialize et
    altBasliklar.forEach(altBaslik => {
      aylikVeriler[altBaslik] = {};
      for (let i = 0; i < 12; i++) {
        aylikVeriler[altBaslik][i] = 0;
      }
    });

    // Giderleri kategorize et
    giderler.forEach(gider => {
      if ((gider.durum === 'gerceklesen' || gider.durum === 'ödendi') && gider.odemeTarihi && gider.altBaslik) {
        const date = parseDate(gider.odemeTarihi);
        if (date && date.getFullYear() === currentYear) {
          const month = date.getMonth();
          if (aylikVeriler[gider.altBaslik]) {
            aylikVeriler[gider.altBaslik][month] += (gider.tutar || 0);
          }
        }
      }
    });

    // Dataset'leri oluştur
    const datasets = altBasliklar.map((altBaslik, index) => ({
      label: altBaslik,
      data: ayLabels.map((_, i) => aylikVeriler[altBaslik][i] || 0),
      backgroundColor: colorPalette[index % colorPalette.length],
      borderColor: colorPalette[index % colorPalette.length].replace('0.8', '1'),
      borderWidth: 1,
      borderRadius: 2,
    }));

    return {
      labels: ayLabels,
      datasets: datasets.filter(dataset => 
        dataset.data.some(value => value > 0) // Sadece verisi olan kategorileri göster
      )
    };
  }, [giderler, altBasliklar, loading]);

  // Grafik ayarları
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 11,
            family: 'sans-serif',
          },
          usePointStyle: true,
          boxWidth: 8,
          padding: 12,
          maxLines: 3,
        },
      },
      title: {
        display: true,
        text: 'Aylık Gider Alt Başlıkları Dağılımı',
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
          label: function(context: { dataset: { label?: string }; parsed: { y: number }; datasetIndex: number }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += displayMoney(context.parsed.y);
            }
            return label;
          },
          footer: function(tooltipItems: any[]) {
            let total = 0;
            tooltipItems.forEach(item => {
              total += item.parsed.y;
            });
            return `Toplam: ${displayMoney(total)}`;
          }
        },
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        bodyColor: '#fff',
        footerColor: '#fff',
        borderColor: 'rgba(17, 24, 39, 1)',
        borderWidth: 1,
        borderRadius: 6,
        titleFont: {
          family: 'sans-serif',
          weight: 'bold' as const,
          size: 14,
        },
        bodyFont: {
          family: 'sans-serif',
          size: 12,
        },
        footerFont: {
          family: 'sans-serif',
          weight: 'bold' as const,
          size: 12,
        },
        padding: 12,
      }
    },
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
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

  if (loading) {
    return (
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center h-64 lg:h-80">
        <div className="text-gray-500">Veriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col items-center xl:col-span-2">
      <div className="w-full h-64 lg:h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 