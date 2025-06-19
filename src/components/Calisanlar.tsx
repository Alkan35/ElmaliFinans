import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { addMonthsToDate } from '@/utils/dateUtils';
import { useCompany } from '@/contexts/CompanyContext';

interface Calisan {
  id: string;
  isim: string;
  maas: number;
  maasTarihi: string; // YYYY-MM-DD
}

function formatMoney(value: string) {
  // Sadece rakamları al, baştaki sıfırları sil
  const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
  if (!cleaned) return '';
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function Calisanlar() {
  const { currentCompany } = useCompany();
  const [modalOpen, setModalOpen] = useState(false);
  const [calisanlar, setCalisanlar] = useState<Calisan[]>([]);
  const [isim, setIsim] = useState('');
  const [maas, setMaas] = useState('');
  const [maasTarihi, setMaasTarihi] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalisanlar = async () => {
      setLoading(true);
      
      if (!currentCompany) {
        setCalisanlar([]);
        setLoading(false);
        return;
      }

      try {
          // Şirkete özel çalışanlar koleksiyonu
          const collectionName = `calisanlar-${currentCompany.id}`;
          const snap = await getDocs(collection(db, collectionName));
          setCalisanlar(snap.docs.map(doc => {
              const data = doc.data();
              return {
                  id: doc.id,
                  isim: data.isim || '',
                  maas: typeof data.maas === 'number' ? data.maas : 0,
                  maasTarihi: data.maasTarihi || ''
              } as Calisan;
          }));
      } catch (error) {
          console.error("Çalışanlar çekilirken hata oluştu:", error);
          setCalisanlar([]);
      }
      setLoading(false);
    };
    fetchCalisanlar();
  }, [currentCompany]);

  const handleEkle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany) {
      alert('Lütfen önce bir şirket seçiniz.');
      return;
    }

    const maasNumerik = Number(maas.replace(/\./g, ''));
    if (isNaN(maasNumerik)) {
        alert("Geçersiz maaş değeri.");
        return;
    }

    const yeniCalisan = {
      isim,
      maas: maasNumerik,
      maasTarihi
    };

    try {
        // Şirkete özel çalışanlar koleksiyonuna ekle
        const calisanlarCollectionName = `calisanlar-${currentCompany.id}`;
        const ref = await addDoc(collection(db, calisanlarCollectionName), yeniCalisan);
        const yeniCalisanId = ref.id;

         // Girilen maaş tarihini YYYY-MM-DD formatından parse et
        const [yil, ay, gun] = maasTarihi.split('-').map(Number);
        if (isNaN(yil) || isNaN(ay) || isNaN(gun)) {
             alert("Geçersiz maaş tarihi formatı. Lütfen YYYY-MM-DD formatını kullanın.");
             setCalisanlar([...calisanlar, { id: yeniCalisanId, ...yeniCalisan }]);
             setIsim(''); setMaas(''); setMaasTarihi(''); setModalOpen(false);
             return;
        }
        // Başlangıç tarihini oluştururken yerel saat diliminde belirli bir saat kullan (örneğin öğlen 12:00)
        const ilkOdemeDate = new Date(yil, ay - 1, gun, 12, 0, 0); // Ay 0-indexed, saat 12:00

        const suAnkiYil = new Date().getFullYear();
        const sonAy = 11; // Aralık (0-indexed)

        const batch = writeBatch(db);

        // Şirkete özel giderler koleksiyonuna maaş giderlerini ekle
        const giderlerCollectionName = `giderler-${currentCompany.id}`;

        for (let i = 0; ; i++) {
            // addMonthsToDate fonksiyonu artık öğlen 12:00'yi kullanıyor
            const currentMonthDate = addMonthsToDate(ilkOdemeDate, i);

            // Eğer hesaplanan ay, mevcut yıldan sonraki bir yıla denk gelirse veya
            // mevcut yıl içinde Aralık ayından sonraya denk gelirse döngüyü kır.
            // Öğlen 12:00 kullandığımız için bu karşılaştırma daha güvenli.
             if (currentMonthDate.getFullYear() > suAnkiYil ||
                (currentMonthDate.getFullYear() === suAnkiYil && currentMonthDate.getMonth() > sonAy)) {
                break;
            }

            // Hesaplanan tarihi tekrar YYYY-MM-DD formatına çevirirken
            // getFullYear, getMonth, getDate gibi yerel saat dilimi metotlarını kullan.
            const formatliSonOdemeTarihi = `${currentMonthDate.getFullYear()}-${(currentMonthDate.getMonth() + 1).toString().padStart(2, '0')}-${currentMonthDate.getDate().toString().padStart(2, '0')}`;

            const giderData = {
              calisanId: yeniCalisanId,
              ad: yeniCalisan.isim,
              baslik: 'İşletme',
              altBaslik: 'Maaş',
              tur: 'Düzenli',
              tutar: yeniCalisan.maas,
              odemeTarihi: '',
              sonOdemeTarihi: formatliSonOdemeTarihi, // YYYY-MM-DD formatında string olarak kaydet
              durum: 'kesinlesen',
              createdAt: Timestamp.now(),
              odendi: false,
            };

            const yeniGiderRef = doc(collection(db, giderlerCollectionName));
            batch.set(yeniGiderRef, giderData);
        }

        await batch.commit();

        setCalisanlar([...calisanlar, { id: yeniCalisanId, ...yeniCalisan }]);

        alert('Yeni çalışan ve ilgili maaş giderleri eklendi!');

    } catch (error) {
        console.error("Çalışan veya gider eklenirken hata oluştu:", error);
        alert("Çalışan veya gider eklenirken bir hata oluştu.");
    }

    setIsim('');
    setMaas('');
    setMaasTarihi('');
    setModalOpen(false);
  };

  const handleSil = async (id: string) => {
    if (!confirm('Çalışanı silmek istediğinize emin misiniz?')) return;

    if (!currentCompany) {
      alert('Lütfen önce bir şirket seçiniz.');
      return;
    }

    try {
        // Şirkete özel koleksiyonlardan sil
        const giderlerCollectionName = `giderler-${currentCompany.id}`;
        const calisanlarCollectionName = `calisanlar-${currentCompany.id}`;
        
        const giderQuery = query(
            collection(db, giderlerCollectionName),
            where('calisanId', '==', id),
            where('odendi', '==', false)
        );
        const snap = await getDocs(giderQuery);

        const batch = writeBatch(db);
        snap.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        batch.delete(doc(db, calisanlarCollectionName, id));

        await batch.commit();

        setCalisanlar(calisanlar.filter(c => c.id !== id));

        alert('Çalışan ve ödenmemiş ilgili maaş giderleri başarıyla silindi.');

    } catch (error) {
        console.error("Çalışan veya giderler silinirken hata oluştu:", error);
        alert("Çalışan veya ilgili giderler silinirken bir hata oluştu.");
    }
  };

  // Şirket seçilmemişse uyarı göster
  if (!currentCompany) {
    return (
      <div className="w-full">
        <div className="text-center py-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-amber-100 rounded-full">
              <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Şirket Seçiniz</h3>
              <p className="text-gray-500">
                Çalışanları görüntülemek için önce bir şirket seçmeniz gerekiyor.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Çalışanlar</h2>
        <button onClick={() => setModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Çalışan Ekle</button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="text-xs text-gray-700 uppercase bg-gray-50">
              <th className="px-6 py-3 text-left font-semibold">Çalışan İsmi</th>
              <th className="px-6 py-3 text-left font-semibold">Maaşı</th>
              <th className="px-6 py-3 text-left font-semibold">Maaş Tarihi</th>
              <th className="px-6 py-3 text-left font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Yükleniyor...</td></tr>
            ) : calisanlar.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Kayıtlı çalışan yok.</td></tr>
            ) : (
              calisanlar.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900 font-medium">{c.isim || '-'}</td>
                  <td className="px-6 py-3 text-gray-900 font-medium">{typeof c.maas === 'number' ? c.maas.toLocaleString('tr-TR') : '0'} TL</td>
                  {/* Maaş tarihini GG/AA/YYYY formatında göster (eskisi gibi) */}
                  <td className="px-6 py-3 text-gray-900 font-medium">{c.maasTarihi ? (() => { const [yil, ay, gun] = c.maasTarihi.split('-'); return `${gun?.padStart(2, '0') || '-'}/${ay?.padStart(2, '0') || '-'}/${yil || '-'}`; })() : '-'}</td>
                  <td className="px-6 py-3">
                    <button onClick={() => handleSil(c.id)} className="text-red-600 hover:underline font-semibold">Sil</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 justify-end">
        <div className="flex items-center gap-4 bg-gradient-to-r from-green-100 to-green-50 rounded-xl shadow px-6 py-4 min-w-[260px]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V19.5z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">{calisanlar.length}</div>
            <div className="text-green-800 font-medium text-sm">Çalışan</div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl shadow px-6 py-4 min-w-[260px]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.343-4 3v1c0 1.657 1.79 3 4 3s4-1.343 4-3v-1c0-1.657-1.79-3-4-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v1m0 0c-2.21 0-4-1.343-4-3v-1c0-1.657 1.79-3 4-3s4 1.343 4 3v1c0 1.657-1.79 3-4 3z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{calisanlar.reduce((sum, c) => sum + (c.maas || 0), 0).toLocaleString('tr-TR')} TL</div>
            <div className="text-blue-800 font-medium text-sm">Toplam Maaş Yükü</div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="bg-white/80 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center tracking-tight">Çalışan Ekle</h3>
            <form onSubmit={handleEkle} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Çalışan İsmi</label>
                <input value={isim} onChange={e=>setIsim(e.target.value)} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-green-400 focus:border-green-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Maaşı</label>
                <input type="text" inputMode="numeric" value={maas} onChange={e=>setMaas(formatMoney(e.target.value))} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 text-right focus:ring-2 focus:ring-green-400 focus:border-green-500 outline-none transition" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Maaş Tarihi</label>
                <input type="date" value={maasTarihi} onChange={e=>setMaasTarihi(e.target.value)} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-green-400 focus:border-green-500 outline-none transition" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold">İptal</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold shadow">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 