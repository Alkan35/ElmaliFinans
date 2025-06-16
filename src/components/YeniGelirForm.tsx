import { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore'; // doc import edildi
import { db } from '@/lib/firebase'; // Firebase konfigürasyonunuzun yolu
import { Gelir } from '@/lib/definitions'; // Gelir arayüzünün yolu
import { addMonthsToDate } from '@/utils/dateUtils'; // addMonthsToDate fonksiyonunun yolu


interface YeniGelirFormProps {
  onClose: () => void; // Modalı kapatmak için prop
}

// Para formatlama fonksiyonu (giderlerden alınan veya yeniden yazılan doğru versiyon)
function formatMoney(value: string) {
    const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
    if (!cleaned) return '';
    // Binlik ayıracı ekle
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Para birimi ile birlikte gösterme fonksiyonu
function displayMoney(value: number | string): string {
    if (typeof value === 'string') {
         value = Number(value.replace(/\./g, '')); // Noktaları kaldırarak sayıya çevir
    }
    if (isNaN(value)) return `0 TL`;
    return `${value.toLocaleString('tr-TR')} TL`;
}


export default function YeniGelirForm({ onClose }: YeniGelirFormProps) {
  const [gelirAdi, setGelirAdi] = useState('');
  const [odemeTuru, setOdemeTuru] = useState<'tekSeferlik' | 'taksitli' | ''>('');
  const [tutar, setTutar] = useState('');
  const [odemeBeklenenTarih, setOdemeBeklenenTarih] = useState('');
  const [toplamTaksitSayisi, setToplamTaksitSayisi] = useState<number | ''>('');
  const [kalanAy, setKalanAy] = useState<number | ''>('');

  const [taksitDetaylari, setTaksitDetaylari] = useState<{
      yuzde: number | '';
      beklenenTarih: string;
      hesaplananTutar: number; // Hesaplanan tutarı saklayalım
      taksitAdi: string; // Taksit ismi
  }[]>([]);

   // Toplam Tutarın Sayı Halini Hesapla
   // tutarTaksitli state'i formatMoney ile formatlandığı için noktaları temizlememiz gerekiyor
   const tutarNumber = Number(tutar.replace(/\./g, ''));


  // Taksit sayısı değiştiğinde detayları oluştur
  useEffect(() => {
    if (typeof toplamTaksitSayisi !== 'number' || toplamTaksitSayisi <= 0) {
      setTaksitDetaylari([]);
      return;
    }

    const yeniDetaylar = Array.from({ length: toplamTaksitSayisi }, (_, index) => {
        // Taksit isimlerini belirle (Ön Ödeme, 1. Taksit, 2. Taksit, ..., Final Ödemesi)
        let taksitAdi = `${index}. Taksit`; // Geçici isim
        if (index === 0) {
            taksitAdi = 'Ön Ödeme';
        } else if (index === toplamTaksitSayisi - 1) {
            taksitAdi = 'Final Ödemesi';
        } else {
             taksitAdi = `${index}. Taksit`; // Aradaki taksitler (index 1'den başlayacak)
        }


        // Eğer daha önce oluşturulmuş detaylar varsa, mevcut değerleri koru
        const mevcutDetay = taksitDetaylari[index];

        return {
            yuzde: mevcutDetay?.yuzde || '',
            beklenenTarih: mevcutDetay?.beklenenTarih || '',
            hesaplananTutar: mevcutDetay?.hesaplananTutar || 0,
            taksitAdi: taksitAdi // Taksit ismini set et
        };
    });

    // Yeni oluşturulan detaylarla mevcut detayları birleştir
     const birlestirilmisDetaylar = yeniDetaylar.map((yeniDetay, index) => {
         const mevcutDetay = taksitDetaylari[index];
         if (mevcutDetay) {
             // Mevcut detay varsa, yeni adı alıp diğerlerini koru
              return {
                  ...mevcutDetay,
                  taksitAdi: yeniDetay.taksitAdi // Sadece taksit adını güncelle
              };
         }
         return yeniDetay; // Yeni detay ekle
     }).slice(0, toplamTaksitSayisi);


    setTaksitDetaylari(birlestirilmisDetaylar);

  }, [toplamTaksitSayisi]);

  // Taksit yüzdesi değiştiğinde tutarı hesapla ve toplam yüzde kontrolü yap
  const handleTaksitYuzdeChange = (index: number, yuzde: string) => {
      const yuzdeNumber = Number(yuzde);
      // Yüzdeyi sayıya çeviremiyorsak veya negatifse işlem yapma
      if (isNaN(yuzdeNumber) || yuzdeNumber < 0) {
           const yeniDetaylar = [...taksitDetaylari];
           yeniDetaylar[index] = {
               ...yeniDetaylar[index],
               yuzde: yuzde, // Kullanıcının girdiği değeri tut
               hesaplananTutar: 0
            };
           setTaksitDetaylari(yeniDetaylar);
           return;
      }

      // Toplam yüzdeyi kontrol et (mevcut taksit hariç + yeni taksitin yüzdesi)
      const digerTaksitlerToplami = taksitDetaylari.reduce((sum, detay, i) => {
          if (i === index) return sum; // Mevcut taksiti hariç tut
          return sum + Number(detay.yuzde || 0);
      }, 0);

      // Yeni yüzde eklendiğinde toplam %100'ü geçiyor mu kontrolü
      if (digerTaksitlerToplami + yuzdeNumber > 100.01) { // Küçük bir tolerans eklendi
           alert(`Taksit yüzdelerinin toplamı %100'ü geçemez! Mevcut toplam (bu taksit hariç): ${digerTaksitlerToplami.toFixed(2)}%`);
           // Yüzdeyi güncelleme, hesaplanan tutarı sıfırla
           const yeniDetaylar = [...taksitDetaylari];
           yeniDetaylar[index] = {
                ...yeniDetaylar[index],
                yuzde: yuzde, // Kullanıcının girdiği değeri tut (isteğe bağlı, hata mesajı verip temiz de yapılabilir)
                hesaplananTutar: 0 // Hesaplanan tutarı sıfırla
           };
           setTaksitDetaylari(yeniDetaylar);
           return; // İşlemi durdur
      }


      const hesaplananTutar = (tutarNumber * yuzdeNumber) / 100;

      const yeniDetaylar = [...taksitDetaylari];
      yeniDetaylar[index] = {
          ...yeniDetaylar[index],
          yuzde: yuzde,
          hesaplananTutar: hesaplananTutar
      };
      setTaksitDetaylari(yeniDetaylar);
  };

  // Taksit beklenen tarih değiştiğinde güncelle
   const handleTaksitTarihChange = (index: number, tarih: string) => {
       const yeniDetaylar = [...taksitDetaylari];
       yeniDetaylar[index] = {
           ...yeniDetaylar[index],
           beklenenTarih: tarih
       };
       setTaksitDetaylari(yeniDetaylar);
   };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gelirAdi || !odemeTuru || !tutar || !odemeBeklenenTarih) {
      alert("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    if (isNaN(tutarNumber) || tutarNumber <= 0) {
        alert("Geçerli bir tutar giriniz.");
        return;
    }

    try {
      if (odemeTuru === 'tekSeferlik') {
        // Tek seferlik gelir kaydı
        const gelirData: Gelir = {
          id: '', // Firestore tarafından atanacak
          ad: gelirAdi,
          tur: 'tekSeferlik',
          durum: 'kesinlesen', // 'bekleniyor' yerine 'kesinlesen' olarak değiştirildi
          tutar: tutarNumber,
          paraBirimi: 'TL',
          odemeBeklenenTarih: odemeBeklenenTarih,
          createdAt: Timestamp.now(), // Şimdiki zaman
        };
        await addDoc(collection(db, 'gelirler'), gelirData);

      } else if (odemeTuru === 'taksitli') {
        // Taksitli gelir kayıtları (her taksit ayrı belge)

        // Validation: Taksit yüzdelerinin toplamı 100 olmalı (handleSubmit'teki son kontrol)
         const totalYuzde = taksitDetaylari.reduce((sum, detay) => sum + Number(detay.yuzde || 0), 0);
         if (Math.abs(totalYuzde - 100) > 0.01) { // %100'e çok yakın değilse
             alert(`Taksit yüzdelerinin toplamı 100 olmalıdır. Mevcut toplam: ${totalYuzde.toFixed(2)}%`);
             return;
         }

         // Validation: Tüm taksitlerin beklenen tarihi dolu olmalı
         const eksikTarihVar = taksitDetaylari.some(detay => !detay.beklenenTarih);
         if (eksikTarihVar) {
             alert("Lütfen tüm taksitler için beklenen ödeme tarihini giriniz.");
             return;
         }
          // Validation: Tüm taksitlerin hesaplanan tutarı 0'dan büyük olmalı (yüzdesi girilmemiş olabilir)
         const sifirTutarVar = taksitDetaylari.some(detay => detay.hesaplananTutar <= 0);
          if (sifirTutarVar) {
              alert("Lütfen tüm taksitler için geçerli bir yüzde girerek tutarın hesaplandığından emin olunuz.");
              return;
          }


         // Batch write kullanarak birden fazla belgeyi tek seferde yazma
         const batch = writeBatch(db);

         taksitDetaylari.forEach((detay, index) => {
             const taksitData: Gelir = {
                id: '', // Firestore tarafından atanacak
                ad: `${gelirAdi} - ${detay.taksitAdi}`, // Gelir Adı + Taksit Adı
                tur: 'taksitli', // Taksitler de 'taksitli' türünde
                durum: 'kesinlesen', // 'bekleniyor' yerine 'kesinlesen' olarak değiştirildi
                tutar: detay.hesaplananTutar, // Hesaplanan taksit tutarı
                paraBirimi: 'TL',
                odemeBeklenenTarih: detay.beklenenTarih, // YYYY-MM-DD formatında
                createdAt: Timestamp.now(),
                // Taksit bilgileri
                toplamTaksitSayisi: toplamTaksitSayisi as number, // Toplam Taksit Sayısı
                taksitSirasi: index + 1, // 1'den başlayan sıra
                taksitAdi: detay.taksitAdi,
                // parentId: Ana Kayıt kaldırıldığı için burası boş kalabilir veya undefined
                 kalanAy: (toplamTaksitSayisi as number) - index, // kalanAy = Toplam Taksit - Taksit Sırası (0-indexed)
             };
             const docRef = doc(collection(db, 'gelirler')); // Taksit için yeni belge referansı
             batch.set(docRef, taksitData); // Batch'e ekle
         });

         // Batch işlemini tamamla
         await batch.commit();


      } // aylikHizmet türü de buraya eklenebilir ilerde


      alert('Yeni Gelir başarıyla eklendi!');
      // Formu temizle ve kapat
      setGelirAdi('');
      setOdemeTuru('');
      setTutar('');
      setOdemeBeklenenTarih('');
      setToplamTaksitSayisi('');
      setKalanAy('');

      setTaksitDetaylari([]); // Taksit detaylarını temizle

      onClose(); // Modalı kapat
    } catch (error) {
      console.error('Gelir eklenirken hata oluştu:', error);
      alert('Gelir eklenirken bir hata oluştu!');
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Gelir Adı</label>
        <input
          type="text"
          value={gelirAdi}
          onChange={(e) => setGelirAdi(e.target.value)}
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Ödeme Türü</label>
        <select
          value={odemeTuru}
          onChange={(e) => {
            setOdemeTuru(e.target.value as 'tekSeferlik' | 'taksitli' | '');
            setTutar('');
            setOdemeBeklenenTarih('');
            setToplamTaksitSayisi('');
            setKalanAy('');
          }}
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
        >
          <option value="">Seçiniz</option>
          <option value="tekSeferlik">Tek Ödeme</option>
          <option value="taksitli">Taksitli Ödeme</option>
          {/* Aylık hizmet seçeneği de buraya eklenebilir */}
        </select>
      </div>

      {/* Tutar alanı - Para birimi seçimi kaldırıldı */}
      {odemeTuru && ( // Ödeme türü seçilince tutar alanını göster
          <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tutar (TL)</label> {/* Label güncellendi */}
              <input
                  type="text"
                  inputMode="numeric"
                  value={tutar}
                  onChange={(e) => setTutar(formatMoney(e.target.value))}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
              />
           </div>
      )}

      {odemeTuru && ( // Ödeme türü seçilince Beklenen Tarih alanını göster
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Ödeme Beklenen Tarih</label>
          <input
            type="date"
            value={odemeBeklenenTarih}
            onChange={(e) => setOdemeBeklenenTarih(e.target.value)}
            required
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
          />
        </div>
      )}

      {/* Taksitli ödemeye özel alan */}
      {odemeTuru === 'taksitli' && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Toplam Taksit Sayısı</label>
          <input
            type="number"
            min={1}
            value={toplamTaksitSayisi}
            onChange={(e) => setToplamTaksitSayisi(Math.max(1, Number(e.target.value)))}
            required
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
          />
        </div>
      )}

      {/* Taksit Detayları Paneli */}
      {typeof toplamTaksitSayisi === 'number' && toplamTaksitSayisi > 0 && taksitDetaylari.length > 0 && (
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Taksit Detayları</h3>
          {taksitDetaylari.map((detay, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 border rounded-md bg-white shadow-sm">
              <div className="w-24 font-semibold text-gray-800">{detay.taksitAdi}</div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Yüzde (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100} // Yüzde max 100 olabilir
                        step="0.01"
                        value={detay.yuzde}
                        onChange={(e) => handleTaksitYuzdeChange(index, e.target.value)} // Anlık yüzde kontrolü burada yapılıyor
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold text-sm"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tutar</label>
                      <div className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 text-gray-900 font-semibold text-sm bg-gray-100">
                          {displayMoney(detay.hesaplananTutar)}
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Beklenen Tarih</label>
                      <input
                        type="date"
                        value={detay.beklenenTarih}
                        onChange={(e) => handleTaksitTarihChange(index, e.target.value)}
                        required
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold text-sm"
                      />
                  </div>
              </div>
            </div>
          ))}
            <div className="text-right text-sm font-semibold text-gray-700 mt-2">
                Toplam Yüzde: {taksitDetaylari.reduce((sum, detay) => sum + Number(detay.yuzde || 0), 0).toFixed(2)}%
                <br/>
                Toplam Taksit Tutarı: {displayMoney(taksitDetaylari.reduce((sum, detay) => sum + detay.hesaplananTutar, 0))}
            </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors font-semibold text-lg"
      >
        Yeni Gelir Ekle
      </button>
    </form>
  );
} 