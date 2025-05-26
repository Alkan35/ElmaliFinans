import { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Firebase konfigürasyonunuzun yolu
import { Gelir } from '@/lib/definitions'; // Gelir arayüzünüzün yolu
// addMonthsToDate ve formatTarih fonksiyonlarını utils'ten import et
import { addMonthsToDate, formatTarih } from '@/utils/dateUtils';


interface YeniAylikHizmetFormProps {
  onClose: () => void; // Modalı kapatmak için prop
}

// Para formatlama fonksiyonları (gider ve gelir formlarından alınıyor)
function formatMoney(value: string) {
    const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function displayMoney(value: number | string): string {
    if (typeof value === 'string') {
         value = Number(value.replace(/\./g, '')); // Noktaları kaldırarak sayıya çevir
    }
    if (isNaN(value)) return `0 TL`;
    return `${value.toLocaleString('tr-TR')} TL`;
}


export default function YeniAylikHizmetForm({ onClose }: YeniAylikHizmetFormProps) {
  const [gelirAdi, setGelirAdi] = useState('');
  // Aylık hizmet süresi (ay cinsinden)
  const [aylikHizmetSuresi, setAylikHizmetSuresi] = useState<number | ''>('');
  // Aylık tutar
  const [aylikTutar, setAylikTutar] = useState('');
  // İlk ödeme beklenen tarih
  const [ilkOdemeBeklenenTarih, setIlkOdemeBeklenenTarih] = useState('');

  // Dinamik panel için detaylar
  const [hizmetDetaylari, setHizmetDetaylari] = useState<{
      beklenenTarih: string; // YYYY-MM-DD formatında
      taksitAdi: string; // Örneğin "1. Ay"
  }[]>([]);

  // Aylık tutarın sayı hali
  const aylikTutarNumber = Number(aylikTutar.replace(/\./g, ''));

  // Aylık hizmet süresi veya ilk tarih değiştiğinde detayları güncelle
  useEffect(() => {
      // Eğer süre veya ilk tarih eksikse detayları temizle
    if (typeof aylikHizmetSuresi !== 'number' || aylikHizmetSuresi <= 0 || !ilkOdemeBeklenenTarih) {
      setHizmetDetaylari([]);
      return;
    }

    const ilkTarihDate = new Date(ilkOdemeBeklenenTarih);
    // Geçersiz tarih kontrolü
    if (isNaN(ilkTarihDate.getTime())) {
        setHizmetDetaylari([]);
        return;
    }

    const yeniDetaylar = Array.from({ length: aylikHizmetSuresi }, (_, index) => {
        // Tarihi hesapla (ilk tarihe index kadar ay ekle)
        const beklenenTarihDate = addMonthsToDate(ilkTarihDate, index);
        // YYYY-MM-DD formatında stringe çevir
        const beklenenTarihString = `${beklenenTarihDate.getFullYear()}-${(beklenenTarihDate.getMonth() + 1).toString().padStart(2, '0')}-${beklenenTarihDate.getDate().toString().padStart(2, '0')}`;


        // Taksit/Ay ismi
        const taksitAdi = `${index + 1}. Ay`;

        return {
            beklenenTarih: beklenenTarihString,
            taksitAdi: taksitAdi
        };
    });

    setHizmetDetaylari(yeniDetaylar);

  }, [aylikHizmetSuresi, ilkOdemeBeklenenTarih, aylikTutarNumber]); // Süre veya ilk tarih değiştiğinde tetikle


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validasyonu
    if (!gelirAdi || typeof aylikHizmetSuresi !== 'number' || aylikHizmetSuresi <= 0 || !aylikTutarNumber || !ilkOdemeBeklenenTarih) {
        alert("Lütfen tüm alanları doğru şekilde doldurunuz.");
        return;
    }

    // Aylık tutar 0'dan büyük olmalı
    if (aylikTutarNumber <= 0) {
        alert("Aylık tutar sıfırdan büyük olmalıdır.");
        return;
    }

    // Dinamik detayların oluştuğundan emin ol
    if (hizmetDetaylari.length === 0) {
         alert("Aylık hizmet detayları oluşturulamadı. Lütfen süre ve ilk ödeme tarihini kontrol ediniz.");
         return;
    }


    try {
        // Batch write kullanarak her ay için ayrı belge kaydetme
        const batch = writeBatch(db);

        hizmetDetaylari.forEach((detay, index) => {
             const hizmetData: Gelir = {
                id: '', // Firestore tarafından atanacak
                ad: `${gelirAdi} - ${detay.taksitAdi}`, // Gelir Adı + Ay Bilgisi
                tur: 'aylikHizmet', // Tür: aylikHizmet
                durum: 'kesinlesen', // Aylık hizmetler de kesinleşen olarak başlar
                tutar: aylikTutarNumber, // Aylık tutar
                paraBirimi: 'TL', // SABİT: TL
                odemeBeklenenTarih: detay.beklenenTarih, // YYYY-MM-DD formatında
                createdAt: Timestamp.now(),
                // Hizmet bilgileri
                toplamTaksitSayisi: aylikHizmetSuresi, // Toplam ay sayısı
                taksitSirasi: index + 1, // 1'den başlayan sıra
                taksitAdi: detay.taksitAdi,
                 // kalanAy = Toplam Ay Sayısı - Taksit Sırası (0-indexed)
                kalanAy: aylikHizmetSuresi - (index + 1),
             };
             const docRef = doc(collection(db, 'gelirler')); // Yeni belge referansı
             batch.set(docRef, hizmetData); // Batch'e ekle
         });

        // Batch işlemini tamamla
        await batch.commit();


      alert('Aylık Hizmet başarıyla eklendi!');
      // Formu temizle ve kapat
      setGelirAdi('');
      setAylikHizmetSuresi('');
      setAylikTutar('');
      setIlkOdemeBeklenenTarih('');
      setHizmetDetaylari([]); // Detayları temizle

      onClose(); // Modalı kapat
    } catch (error) {
      console.error('Aylık hizmet eklenirken hata oluştu:', error);
      alert('Aylık hizmet eklenirken bir hata oluştu!');
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
        <label className="block text-sm font-bold text-gray-700 mb-1">Aylık Hizmet Süresi (Ay)</label>
        <input
          type="number"
          min={1}
          max={60} // Maksimum süreyi belirleyebilirsiniz, örneğin 5 yıl (60 ay)
          value={aylikHizmetSuresi}
          onChange={(e) => setAylikHizmetSuresi(Math.max(1, Number(e.target.value)))} // Negatif veya 0 olmasın
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
        />
      </div>

       <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Aylık Tutar (TL)</label>
            <input
              type="text"
              inputMode="numeric"
              value={aylikTutar}
              onChange={(e) => setAylikTutar(formatMoney(e.target.value))}
              required
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
            />
        </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">İlk Ödeme Beklenen Tarih</label>
        <input
          type="date"
          value={ilkOdemeBeklenenTarih}
          onChange={(e) => setIlkOdemeBeklenenTarih(e.target.value)}
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
        />
      </div>

      {/* Dinamik Hizmet Detayları Paneli */}
      {hizmetDetaylari.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Aylık Ödeme Planı</h3>
          {hizmetDetaylari.map((detay, index) => (
            <div key={index} className="flex items-center space-x-4 p-2 border-b last:border-b-0 bg-white rounded-md shadow-sm">
              {/* Tarihi formatTarih ile GG.AA.YYYY formatında göster */}
              <div className="w-32 font-semibold text-gray-800 text-sm">{formatTarih(detay.beklenenTarih)}</div>
              <div className="flex-1 text-sm text-gray-700">{detay.taksitAdi}</div>
              <div className="w-32 text-right font-semibold text-sm text-gray-900">
                  {displayMoney(aylikTutarNumber)}
              </div>
            </div>
          ))}
        </div>
      )}


      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors font-semibold text-lg"
      >
        Hizmeti Ekle
      </button>
    </form>
  );
} 