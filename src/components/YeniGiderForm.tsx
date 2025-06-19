import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { AnaBaslik, AltBaslik } from '@/lib/definitions';
import { addMonthsToDate } from '@/utils/dateUtils';
import { useCompany } from '@/contexts/CompanyContext';

interface YeniGiderFormProps {
  onClose?: () => void;
}

export default function YeniGiderForm({ onClose }: YeniGiderFormProps) {
  const { currentCompany } = useCompany();
  const [ad, setAd] = useState('');
  const [baslik, setBaslik] = useState('');
  const [altBaslik, setAltBaslik] = useState('');
  const [tur, setTur] = useState('');
  const [tutar, setTutar] = useState('');
  const [odemeTarihiInput, setOdemeTarihiInput] = useState('');
  const [kacAy, setKacAy] = useState(1);
  const [basliklar, setBasliklar] = useState<AnaBaslik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasliklar = async () => {
      setLoading(true);
      try {
        const anaSnapshot = await getDocs(collection(db, 'giderBasliklari'));
        const anaList: AnaBaslik[] = anaSnapshot.docs.map(anaDoc => {
          const anaData = anaDoc.data();
          let altBasliklar: AltBaslik[] = [];
          if (Array.isArray(anaData.altBasliklar)) {
            altBasliklar = anaData.altBasliklar.map((alt: AltBaslik, i: number) => ({ id: alt.id || String(i), isim: alt.isim }));
          }
          return { id: anaDoc.id, isim: anaData.isim, altBasliklar };
        });
        setBasliklar(anaList);
      } catch (error) {
        console.error("Başlıklar çekilirken hata oluştu:", error);
      }
      setLoading(false);
    };
    fetchBasliklar();
  }, []);

  const altBasliklar = basliklar.find(b => b.id === baslik)?.altBasliklar || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany) {
      alert("Lütfen önce bir şirket seçiniz.");
      return;
    }

    const collectionName = `giderler-${currentCompany.id}`;

    try {
      if (tur === 'Tek Seferlik') {
        const giderData = {
          ad,
          baslik: basliklar.find(b => b.id === baslik)?.isim || '',
          altBaslik: altBasliklar.find(a => a.id === altBaslik)?.isim || '',
          tur,
          tutar: Number(tutar.replace(/\./g, '')),
          odemeTarihi: '',
          sonOdemeTarihi: odemeTarihiInput,
          durum: 'kesinlesen',
          createdAt: new Date(),
          odendi: false
        };
        await addDoc(collection(db, collectionName), giderData);
      } else {
        const ilkTarih = new Date(odemeTarihiInput);
        if (isNaN(ilkTarih.getTime())) {
            alert("Geçersiz ilk ödeme tarihi.");
            return;
        }

        for (let i = 0; i < kacAy; i++) {
          const yeniTarih = addMonthsToDate(ilkTarih, i);
          const formatliTarih = yeniTarih.toISOString().split('T')[0];

          const giderData = {
            ad,
            baslik: basliklar.find(b => b.id === baslik)?.isim || '',
            altBaslik: altBasliklar.find(a => a.id === altBaslik)?.isim || '',
            tur,
            tutar: Number(tutar.replace(/\./g, '')),
            odemeTarihi: '',
            sonOdemeTarihi: formatliTarih,
            durum: 'kesinlesen',
            createdAt: new Date(),
            odendi: false,
            toplamAy: kacAy,
            kalanAy: kacAy - i
          };
          await addDoc(collection(db, collectionName), giderData);
        }
      }

      alert('Yeni gider eklendi');
      setAd('');
      setBaslik('');
      setAltBaslik('');
      setTur('');
      setTutar('');
      setOdemeTarihiInput('');
      setKacAy(1);
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Gider eklenirken hata oluştu:', error);
      alert('Gider eklenirken bir hata oluştu!');
    }
  };

  function formatMoney(value: string) {
    const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function displayMoney(value: string) {
    const cleaned = value.replace(/\./g, '');
    const numberValue = Number(cleaned);
    if (isNaN(numberValue)) return '0 TL';
    return `${numberValue.toLocaleString('tr-TR')} TL`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-900">Gider Adı</label>
        <input value={ad} onChange={e=>setAd(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900">Gider Başlığı</label>
        <select value={baslik} onChange={e=>{setBaslik(e.target.value); setAltBaslik('')}} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" disabled={loading}>
          <option value="">Seçiniz</option>
          {basliklar.map(b => <option key={b.id} value={b.id}>{b.isim}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900">Gider Alt Başlığı</label>
        <select value={altBaslik} onChange={e=>setAltBaslik(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" disabled={!baslik || loading}>
          <option value="">Seçiniz</option>
          {altBasliklar.map(alt => <option key={alt.id} value={alt.id}>{alt.isim}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900">Gider Türü</label>
        <select value={tur} onChange={e=>setTur(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold">
          <option value="">Seçiniz</option>
          <option value="Tek Seferlik">Tek Seferlik</option>
          <option value="Düzenli">Düzenli</option>
        </select>
      </div>
      
      {tur === 'Tek Seferlik' && (
        <>
          <div>
            <label className="block text-sm font-bold text-gray-900">Tutar</label>
            <input type="text" inputMode="numeric" value={tutar} onChange={e=>setTutar(formatMoney(e.target.value))} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900">Ödenmesi Gereken Tarih</label>
            <input type="date" value={odemeTarihiInput} onChange={e=>setOdemeTarihiInput(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" />
          </div>
        </>
      )}
      
      {tur === 'Düzenli' && (
        <>
          <div>
            <label className="block text-sm font-bold text-gray-900">Kaç Ay Düzenli Ödenecek?</label>
            <input 
              type="number" 
              min={1} 
              max={12}
              value={kacAy} 
              onChange={e=>setKacAy(Math.min(12, Math.max(1, Number(e.target.value))))} 
              required 
              className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" 
            />
            <p className="text-sm text-gray-500 mt-1">Maksimum 12 ay seçilebilir</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900">İlk Ödeme Tarihi</label>
            <input 
              type="date" 
              value={odemeTarihiInput} 
              onChange={e=>setOdemeTarihiInput(e.target.value)} 
              required 
              className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900">Aylık Tutar</label>
            <input 
              type="text" 
              inputMode="numeric" 
              value={tutar} 
              onChange={e=>setTutar(formatMoney(e.target.value))} 
              required 
              className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" 
            />
          </div>
          {odemeTarihiInput && kacAy > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Oluşturulacak Ödemeler</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Array.from({ length: kacAy }, (_, i) => {
                   const ilkTarihDate = new Date(odemeTarihiInput);
                   if (isNaN(ilkTarihDate.getTime())) return null;
                   const yeniTarih = addMonthsToDate(ilkTarihDate, i);
                   const formatliTarihGosterim = yeniTarih.toLocaleDateString('tr-TR');
                  return (
                    <div key={i} className="text-sm text-gray-600">
                      {i + 1}. Ay: {formatliTarihGosterim} - {displayMoney(tutar)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
        Gideri Ekle
      </button>
    </form>
  );
} 