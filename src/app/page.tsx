'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { db } from '@/lib/firebase'; // Firebase konfigürasyonunuzun yolu
// Firestore importları
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
// Chart.js importları ve register edilmesi gereken bileşenler
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2'; // Bar chart bileşeni

// Chart.js için gerekli bileşenleri kaydedin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Para formatlama için KayitDuzenlePaneli'ndeki fonksiyonu kullanabiliriz veya buraya kopyalayabiliriz
// Geçici olarak basit bir formatlama ekleyelim
function formatMoney(value: number | string | undefined | null): string {
     if (value === undefined || value === null || value === '') return '0,00 TL';
     let numValue: number;
     if (typeof value === 'string') {
          const cleanedValue = value.replace(/\./g, '').replace(',', '.').replace('TL', '').trim();
          numValue = Number(cleanedValue);
          if (isNaN(numValue)) return `Geçersiz Tutar`;
     } else {
          numValue = value;
     }

     return new Intl.NumberFormat('tr-TR', {
         style: 'currency',
         currency: 'TRY',
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
     }).format(numValue);
}

// Tarih parse fonksiyonu - DD/MM/YYYY veya YYYY-MM-DD formatlarını dener (Home dışına taşındı)
function parseDate(dateString: string | undefined | null): Date | null {
    if (!dateString || typeof dateString !== 'string') return null;

    // DD/MM/YYYY formatını dene
    const partsDDMMYYYY = dateString.split('/');
     if (partsDDMMYYYY.length === 3) {
        const day = parseInt(partsDDMMYYYY[0]);
        const month = parseInt(partsDDMMYYYY[1]); // Ay 1-12 arası
        const year = parseInt(partsDDMMYYYY[2]);
         if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month > 0 && month <= 12) {
            // Date constructor ay'ı 0'dan başlattığı için month - 1 yapılır.
             const date = new Date(year, month - 1, day);
             // Oluşturulan tarihin orijinal parçalarla eşleştiğini kontrol et (geçersiz tarihleri yakalamak için)
             if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
                 return date;
             }
         }
     }

    // YYYY-MM-DD formatını dene
    const partsYYYYMMDD = dateString.split('-');
    if (partsYYYYMMDD.length === 3) {
        const year = parseInt(partsYYYYMMDD[0]);
        const month = parseInt(partsYYYYMMDD[1]); // Ay 1-12 arası
        const day = parseInt(partsYYYYMMDD[2]);
         if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month > 0 && month <= 12) {
             // Date constructor ay'ı 0'dan başlattığı için month - 1 yapılır.
             const date = new Date(year, month - 1, day);
             // Oluşturulan tarihin orijinal parçalarla eşleştiğini kontrol et (geçersiz tarihları yakalamak için)
              if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
                  return date;
              }
         }
    }

    // Firestore Timestamp objesi geliyorsa (string değilse) - Şu anki interface string diyor, ek bilgi gerekebilir.
    // if (dateString instanceof Timestamp) {
    //     return dateString.toDate();
    // }


    console.warn("Bilinmeyen tarih formatı veya geçersiz tarih stringi:", dateString);
    return null; // Başarısız olursa null döndür
}


// Gelir ve Gider interface'lerini tanımlayalım veya '@/lib/definitions' dosyasından import edelim
// KayitDuzenlePaneli'nde tanımlı olanları kullanabiliriz.
// Eğer ayrı bir definitions dosyanız varsa oradan import etmeniz daha düzenli olur.
interface Gelir {
  id: string;
  ad?: string;
  baslik: string;
  tur: 'tekSeferlik' | 'taksitli' | 'aylikHizmet';
  tutar: number; // Tek seferlik, taksitli veya aylık hizmet tutarı
  toplamTutar?: number; // Taksitli veya aylık hizmetin toplam tutarı
  paraBirimi: string;
  durum: 'bekleniyor' | 'kesinlesen' | 'tahsilEdildi'; // Kesinleşen eklendi
  createdAt: Timestamp;
  odemeBeklenenTarih?: string; // YYYY-MM-DD veya DD/MM/YYYY olabilir
  odemeTarihi?: string; // YYYY-MM-DD veya DD/MM/YYYY olabilir
  kalanAy?: number;
  toplamTaksitSayisi?: number; // Taksitli ise
  taksitSirasi?: number; // Taksitli ise
  altBaslik?: string; // Eğer gelirler için de altbaşlık kullanılıyorsa
  sonOdemeTarihi?: string; // Olası farklı alan adı
}

interface Gider {
  id: string;
  ad?: string;
  baslik: string;
  altBaslik: string; // Gider dağılımı için gerekli
  tarih?: string; // YYYY-MM-DD
  tutar: number;
  durum: 'bekleniyor' | 'ödendi' | 'kesinlesen' | 'gerceklesen'; // 'gerceklesen' eklendi
  tur?: string; // Tek seferlik, düzenli, maaş gibi
  createdAt?: Timestamp;
  odemeTarihi?: string; // Farklı formatlarda olabilir (DD/MM/YYYY veya YYYY-MM-DD gibi)
  odemeBeklenenTarih?: string; // Farklı formatlarda olabilir (DD/MM/YYYY veya YYYY-MM-DD gibi)
  sonOdemeTarihi?: string; // Olası farklı alan adı
  odendi?: boolean; // Firestore verisinde var
}


export default function Home() {
  const [gelirler, setGelirler] = useState<Gelir[]>([]);
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore'dan gerçek zamanlı veri çekme
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Gelirler listener
    const unsubscribeGelirler = onSnapshot(collection(db, 'gelirler'), (snapshot) => {
      const fetchedGelirler = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any // Firestore verisini Gelir tipine cast et
      })) as Gelir[];
      setGelirler(fetchedGelirler);
      // Loading'i sadece son listener çalıştığında kapat
    }, (err) => {
      console.error("Gelirler çekilirken hata:", err);
      setError("Gelir verileri yüklenirken hata oluştu.");
      setLoading(false); // Hata durumunda loading kapat
    });

    // Giderler listener
    const unsubscribeGiderler = onSnapshot(collection(db, 'giderler'), (snapshot) => {
      const fetchedGiderler = snapshot.docs.map(doc => ({
        id: doc.id,
         ...doc.data() as any // Firestore verisini Gider tipine cast et
      })) as Gider[];
      setGiderler(fetchedGiderler);
      setLoading(false); // Tüm datalar çekilince loading false yapıldı
    }, (err) => {
      console.error("Giderler çekilirken hata:", err);
      setError("Gider verileri yüklenirken hata oluştu.");
      setLoading(false); // Hata durumunda loading kapat
    });

    // Cleanup function
    return () => {
      unsubscribeGelirler();
      unsubscribeGiderler();
    };
  }, []); // Boş dependency array, sadece component mount olduğunda çalışır


  // Özet Verileri Hesaplama (useMemo kullanarak performansı artırır)
  const {
    totalGerceklesenGelir,
    totalGerceklesenGider,
    guncelBakiye,
    totalKesinlesenGelir,
    totalKesinlesenGider,
    beklenenDurum,
  } = useMemo(() => {
    // Gerçekleşen Gelir: durum === 'tahsilEdildi'
    const gerceklesenGelirler = gelirler.filter(gelir => gelir.durum === 'tahsilEdildi');
    const totalGerceklesenGelir = gerceklesenGelirler.reduce((sum, gelir) => sum + (gelir.tutar || 0), 0); // Tek seferlik/Taksit/Aylık fark etmez, gerçekleşen tutarı topla

    // Gerçekleşen Gider: durum === 'ödendi' veya 'gerceklesen'
    const gerceklesenGiderler = giderler.filter(gider => gider.durum === 'ödendi' || gider.durum === 'gerceklesen');
    const totalGerceklesenGider = gerceklesenGiderler.reduce((sum, gider) => sum + (gider.tutar || 0), 0);

    // Güncel Bakiye
    const guncelBakiye = totalGerceklesenGelir - totalGerceklesenGider;

    // Kesinleşen Gelir: durum === 'kesinlesen'
     const kesinlesenGelirler = gelirler.filter(gelir => gelir.durum === 'kesinlesen');
    const totalKesinlesenGelir = kesinlesenGelirler.reduce((sum, gelir) => sum + (gelir.tutar || gelir.toplamTutar || 0), 0); // Kesinleşen için toplam tutar daha anlamlı olabilir

    // Kesinleşen Gider: durum === 'kesinlesen'
     const kesinlesenGiderler = giderler.filter(gider => gider.durum === 'kesinlesen');
    const totalKesinlesenGider = kesinlesenGiderler.reduce((sum, gider) => sum + (gider.tutar || 0), 0);


    // Beklenen Durum
    const beklenenDurum = totalKesinlesenGelir - totalKesinlesenGider;


    return {
      totalGerceklesenGelir,
      totalGerceklesenGider,
      guncelBakiye,
      totalKesinlesenGelir,
      totalKesinlesenGider,
      beklenenDurum,
    };
  }, [gelirler, giderler]); // gelirler veya giderler state'i değiştiğinde yeniden hesapla


  // Grafik 1: Gerçekleşen ve Kesinleşen Gelirlerin Aylık Dağılımı İçin Veri Hazırlama
  const gelirlerAylikData = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const aylikGerceklesen: { [key: number]: number } = {}; // Ay index'ine göre toplamlar
      const aylikKesinlesen: { [key: number]: number } = {}; // Ay index'ine göre toplamlar

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
              } else if (date && date.getFullYear() > currentYear) {
                  console.log(`[Gelir] Cari yıldan sonraki bir yıla ait kesinleşen gelir kaydı atlandı: ${gelir.id}, Tarih: ${date.toLocaleDateString()}`);
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
                  // Yumuşak Mavi
                  backgroundColor: 'rgba(96, 165, 250, 0.9)', // Tailwind blue-400'a yakın
                  borderColor: 'rgba(96, 165, 250, 1)',
                  borderWidth: 1,
                  borderRadius: 4,
              },
              {
                  label: 'Kesinleşen Gelir',
                   data: labels.map((_, i) => aylikKesinlesen[i]),
                  // Yumuşak Yeşil
                  backgroundColor: 'rgba(52, 211, 163, 0.9)', // Tailwind green-400'a yakın
                  borderColor: 'rgba(52, 211, 163, 1)',
                  borderWidth: 1,
                  borderRadius: 4,
              },
          ],
      };

  }, [gelirler]); // Gelir verisi değiştiğinde yeniden hesapla

    // Grafik 1: Seçenekler - Daha Modern ve Sık Stil
   const gelirlerAylikOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const, // Lejant alta alındı
                labels: {
                    font: {
                        size: 12,
                         family: 'sans-serif',
                    },
                     usePointStyle: true,
                     boxWidth: 8, // Lejant işaretçisi boyutu artırıldı
                     padding: 20, // Lejant etrafına boşluk
                },
            },
            title: {
                display: true,
                text: 'Aylık Gelir Durumu (Gerçekleşen vs Kesinleşen)',
                font: {
                    size: 17, // Başlık yazı boyutu ayarlandı
                    weight: 'bold',
                     family: 'sans-serif',
                },
                 color: '#333',
                 padding: { // Başlık altına boşluk
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
                             label += formatMoney(context.parsed.y);
                         }
                         return label;
                     }
                 },
                 backgroundColor: 'rgba(17, 24, 39, 0.9)', // Koyu gri (almost black)
                 bodyColor: '#fff',
                 borderColor: 'rgba(17, 24, 39, 1)',
                 borderWidth: 1,
                 borderRadius: 4,
                 titleFont: {
                     family: 'sans-serif',
                     weight: 'bold',
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
                     display: false, // Dikey grid çizgilerini gizle
                     borderColor: '#eee', // Eksen rengi
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
                         weight: 'bold',
                          family: 'sans-serif',
                     },
                      color: '#555',
                 }
            },
            y: {
                beginAtZero: true,
                 grid: {
                     color: '#eee', // Yatay grid çizgileri rengi
                     borderDash: [2, 2],
                     borderColor: '#eee', // Eksen rengi
                 },
                 ticks: {
                     callback: function(value: any, index: any, values: any) {
                         return formatMoney(value);
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
                         weight: 'bold',
                          family: 'sans-serif',
                     },
                      color: '#555',
                 }
            }
        }
   }), []);


   // Grafik 2: Gerçekleşen ve Kesinleşen Giderlerin Aylık Dağılımı İçin Veri Hazırlama
    const giderlerAylikData = useMemo(() => {
        console.log("[Giderler Aylik Data] Gider verisi güncellendi. Toplam gider kaydı:", giderler.length);
        const aylikGerceklesen: { [key: number]: { [year: number]: number } } = {}; // Ay ve yıla göre toplamlar
        const aylikKesinlesen: { [key: number]: { [year: number]: number } } = {}; // Ay ve yıla göre toplamlar

        giderler.forEach(gider => {
            // Gerçekleşen Giderler: durum === 'gerceklesen' (veya 'ödendi' de eklenebilir duruma göre)
            if ((gider.durum === 'gerceklesen' || gider.durum === 'ödendi') && gider.odemeTarihi) {
                console.log(`[Giderler Aylik Data] Gerçekleşen Gider işleniyor: ID=${gider.id}, Durum=${gider.durum}, Tutar=${gider.tutar}, TarihString=${gider.odemeTarihi}`);
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
                    console.log(`[Giderler Aylik Data] Gerçekleşen Gider eklendi: Yıl=${year}, Ay=${month}, Tutar=${gider.tutar}`);
                 } else {
                     console.warn(`[Giderler Aylik Data] Gerçekleşen Gider kaydı için tarih parse edilemedi veya geçersiz: ${gider.id}, Tarih Stringi: ${gider.odemeTarihi}`);
                 }
            }

            // Kesinleşen Giderler - durum === 'kesinlesen'
            if (gider.durum === 'kesinlesen' && (gider.odemeBeklenenTarih || gider.sonOdemeTarihi)) {
                const dateString = gider.odemeBeklenenTarih || gider.sonOdemeTarihi;
                console.log(`[Giderler Aylik Data] Kesinleşen Gider işleniyor: ID=${gider.id}, Durum=${gider.durum}, Tutar=${gider.tutar}, TarihString=${dateString}`);
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
                    console.log(`[Giderler Aylik Data] Kesinleşen Gider eklendi: Yıl=${year}, Ay=${month}, Tutar=${gider.tutar}`);
                 } else {
                      console.warn(`[Giderler Aylik Data] Kesinleşen Gider kaydı için tarih parse edilemedi veya geçersiz: ${gider.id}, Tarih Stringi: ${dateString}`);
                 }
            }
        });

        // Şu an sadece cari yılı göstereceğiz, ancak gelecekte buradan istenen yılı seçebiliriz.
        const currentYear = new Date().getFullYear();
        const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        const gerceklesenDataForChart = labels.map((_, i) => aylikGerceklesen[i]?.[currentYear] || 0);
        const kesinlesenDataForChart = labels.map((_, i) => aylikKesinlesen[i]?.[currentYear] || 0);

        console.log(`[Giderler Aylik Data] ${currentYear} yılı Aylık Gerçekleşen Toplamlar (Grafik İçin):`, gerceklesenDataForChart);
        console.log(`[Giderler Aylik Data] ${currentYear} yılı Aylık Kesinleşen Toplamlar (Grafik İçin):`, kesinlesenDataForChart);

        return {
            labels,
            datasets: [
                {
                    label: 'Gerçekleşen Gider',
                    data: gerceklesenDataForChart,
                     // Yumuşak Kırmızı
                    backgroundColor: 'rgba(251, 146, 60, 0.9)', // Tailwind orange-400'a yakın
                    borderColor: 'rgba(251, 146, 60, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Kesinleşen Gider',
                     data: kesinlesenDataForChart,
                    // Yumuşak Mor
                    backgroundColor: 'rgba(165, 180, 252, 0.9)', // Tailwind violet-400'a yakın
                    borderColor: 'rgba(165, 180, 252, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };

    }, [giderler]); // Gider verisi değiştiğinde yeniden hesapla

     // Grafik 2: Seçenekler - Daha Modern ve Sık Stil (Gelir grafiği ile uyumlu)
    const giderlerAylikOptions = useMemo(() => ({
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
                     weight: 'bold',
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
                              label += formatMoney(context.parsed.y);
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
                      weight: 'bold',
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
                          weight: 'bold',
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
                      callback: function(value: any, index: any, values: any) {
                          return formatMoney(value);
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
                          weight: 'bold',
                           family: 'sans-serif',
                      },
                       color: '#555',
                  }
             }
         }
    }), []);

    // Grafik 3: Gerçekleşen Gelir ve Gerçekleşen Giderlerin Aylık Dağılımı İçin Veri Hazırlama
    const gerceklesenAylikData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const aylikGerceklesenGelir: { [key: number]: number } = {}; // Ay index'ine göre toplamlar
        const aylikGerceklesenGider: { [key: number]: number } = {}; // Ay index'ine göre toplamlar

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

        return {
            labels,
            datasets: [
                {
                    label: 'Gerçekleşen Gelir',
                    data: labels.map((_, i) => aylikGerceklesenGelir[i]),
                    backgroundColor: 'rgba(52, 211, 163, 0.9)', // Yumuşak Yeşil
                    borderColor: 'rgba(52, 211, 163, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Gerçekleşen Gider',
                     data: labels.map((_, i) => aylikGerceklesenGider[i]),
                    backgroundColor: 'rgba(251, 146, 60, 0.9)', // Yumuşak Turuncu (Gider için kırmızıya yakın)
                    borderColor: 'rgba(251, 146, 60, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };

    }, [gelirler, giderler]); // Hem gelir hem de gider verisi değiştiğinde yeniden hesapla

    // Grafik 3: Seçenekler - Daha Modern ve Sık Stil (Diğer grafiklerle uyumlu)
     const gerceklesenAylikOptions = useMemo(() => ({
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
                 text: 'Aylık Gerçekleşen Durum (Gelir vs Gider)',
                 font: {
                     size: 17,
                     weight: 'bold',
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
                              label += formatMoney(context.parsed.y);
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
                      weight: 'bold',
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
                          weight: 'bold',
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
                      callback: function(value: any, index: any, values: any) {
                          return formatMoney(value);
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
                          weight: 'bold',
                           family: 'sans-serif',
                      },
                       color: '#555',
                  }
             }
         }
    }), []);


  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-100 p-8">
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-800">
                  Dashboard
                </h1>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Veriler yükleniyor...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Hata: {error}</div>
            ) : (
              <div className="p-6">
                {/* Özet Kartlar - İlk Satır */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Toplam Gelir (Gerçekleşen) Kartı */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-base font-medium text-gray-600 mb-2">Toplam Gelir (Gerçekleşen)</h3>
                    <p className="text-2xl font-bold text-green-600">{formatMoney(totalGerceklesenGelir)}</p>
                  </div>

                  {/* Toplam Gider (Gerçekleşen) Kartı */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-base font-medium text-gray-600 mb-2">Toplam Gider (Gerçekleşen)</h3>
                    <p className="text-2xl font-bold text-red-600">{formatMoney(totalGerceklesenGider)}</p>
                  </div>

                  {/* Güncel Bakiye Kartı */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-base font-medium text-gray-600 mb-2">Güncel Bakiye</h3>
                    <p className={`text-2xl font-bold ${guncelBakiye >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatMoney(guncelBakiye)}</p>
                  </div>
                </div>

                 {/* Özet Kartlar - İkinci Satır */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                   {/* Toplam Beklenen Gelir (Kesinleşen) Kartı */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                       <h3 className="text-base font-medium text-gray-600 mb-2">Toplam Beklenen Gelir (Kesinleşen)</h3>
                       <p className="text-2xl font-bold text-yellow-600">{formatMoney(totalKesinlesenGelir)}</p>
                   </div>

                   {/* Toplam Beklenen Gider (Kesinleşen) Kartı */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                       <h3 className="text-base font-medium text-gray-600 mb-2">Toplam Beklenen Gider (Kesinleşen)</h3>
                       <p className="text-2xl font-bold text-orange-600">{formatMoney(totalKesinlesenGider)}</p>
                   </div>

                   {/* Beklenen Durum Kartı */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                       <h3 className="text-base font-medium text-gray-600 mb-2">Beklenen Durum</h3>
                        <p className={`text-2xl font-bold ${beklenenDurum >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{formatMoney(beklenenDurum)}</p>
                   </div>
                </div>


                {/* Grafik Alanı */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                     {/* Grafik 1: Gerçekleşen vs Kesinleşen Gelir */}
                     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
                         <div className="w-full h-80">
                             <Bar data={gelirlerAylikData} options={gelirlerAylikOptions} />
                         </div>
                     </div>

                     {/* Grafik 2: Gerçekleşen vs Kesinleşen Gider */}
                     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
                         <div className="w-full h-80">
                             <Bar data={giderlerAylikData} options={giderlerAylikOptions} />
                         </div>
                     </div>

                     {/* Grafik 3: Gerçekleşen Gelir vs Gerçekleşen Gider */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col items-center">
                         <div className="w-full h-80">
                             <Bar data={gerceklesenAylikData} options={gerceklesenAylikOptions} />
                         </div>
                     </div>

                 </div>


                {/* Son İşlemler Tablosu (Şimdilik kaldırıldı veya pasif) */}
                {/* <div className="mt-8"> ... </div> */}

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
