import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AltBaslik {
  id: string;
  isim: string;
}
interface AnaBaslik {
  id: string;
  isim: string;
  altBasliklar: AltBaslik[];
}

interface OdemeDetay {
  tarih: string;
  tutar: string;
}

interface GecmisGiderFormProps {
  onClose: () => void;
}

export default function GecmisGiderForm({ onClose }: GecmisGiderFormProps) {
  const [ad, setAd] = useState('');
  const [baslik, setBaslik] = useState('');
  const [altBaslik, setAltBaslik] = useState('');
  const [tur, setTur] = useState('');
  const [tutar, setTutar] = useState('');
  const [odemeTarihi, setOdemeTarihi] = useState('');
  const [toplamAy, setToplamAy] = useState(1);
  const [odemeDetaylari, setOdemeDetaylari] = useState<OdemeDetay[]>([]);
  const [basliklar, setBasliklar] = useState<AnaBaslik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasliklar = async () => {
      setLoading(true);
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
      setLoading(false);
    };
    fetchBasliklar();
  }, []);

  const altBasliklar = basliklar.find(b => b.id === baslik)?.altBasliklar || [];

  // Düzenli gider için ödeme detayları oluşturma
  useEffect(() => {
    if (tur === 'Düzenli' && toplamAy > 0) {
      const yeniDetaylar: OdemeDetay[] = [];
      for (let i = 0; i < toplamAy; i++) {
        yeniDetaylar.push({ tarih: '', tutar: '' });
      }
      setOdemeDetaylari(yeniDetaylar);
    }
  }, [tur, toplamAy]);

  const handleOdemeDetayChange = (index: number, field: keyof OdemeDetay, value: string) => {
    const yeniDetaylar = [...odemeDetaylari];
    yeniDetaylar[index] = { ...yeniDetaylar[index], [field]: value };
    setOdemeDetaylari(yeniDetaylar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tur === 'Tek Seferlik') {
      // Tek seferlik geçmiş gider için
      const giderData = {
        ad,
        baslik: basliklar.find(b => b.id === baslik)?.isim || '',
        altBaslik: altBasliklar.find(a => a.id === altBaslik)?.isim || '',
        tur,
        tutar: Number(tutar.replace(/\./g, '')),
        odemeTarihi,
        tarih: odemeTarihi,
        durum: 'gerceklesen',
        createdAt: new Date(),
        odendi: true,
        sonOdemeTarihi: odemeTarihi,
      };
      await addDoc(collection(db, 'giderler'), giderData);
    } else {
      // Düzenli geçmiş gider için her ay için ayrı kayıt
      for (let i = 0; i < toplamAy; i++) {
        const detay = odemeDetaylari[i];
        if (!detay.tarih || !detay.tutar) {
          alert(`Lütfen ${i + 1}. ay için tarih ve tutar bilgilerini giriniz.`);
          return;
        }

        const giderData = {
          ad,
          baslik: basliklar.find(b => b.id === baslik)?.isim || '',
          altBaslik: altBasliklar.find(a => a.id === altBaslik)?.isim || '',
          tur,
          tutar: Number(detay.tutar.replace(/\./g, '')),
          odemeTarihi: detay.tarih,
          tarih: detay.tarih,
          durum: 'gerceklesen',
          createdAt: new Date(),
          odendi: true,
          toplamAy,
          kalanAy: 0,
          sonOdemeTarihi: detay.tarih,
        };
        await addDoc(collection(db, 'giderler'), giderData);
      }
    }
    
    alert('Geçmiş giderler eklendi');
    setAd('');
    setBaslik('');
    setAltBaslik('');
    setTur('');
    setTutar('');
    setOdemeTarihi('');
    setToplamAy(1);
    setOdemeDetaylari([]);
    onClose();
  };

  function formatMoney(value: string) {
    const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
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
            <label className="block text-sm font-bold text-gray-900">Ödendiği Tarih</label>
            <input type="date" value={odemeTarihi} onChange={e=>setOdemeTarihi(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" />
          </div>
        </>
      )}
      
      {tur === 'Düzenli' && (
        <>
          <div>
            <label className="block text-sm font-bold text-gray-900">Geçmişe Dayalı Kaç Ay Düzenli Ödendi</label>
            <input 
              type="number" 
              min={1} 
              max={12}
              value={toplamAy} 
              onChange={e=>setToplamAy(Math.min(12, Math.max(1, Number(e.target.value))))} 
              required 
              className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" 
            />
            <p className="text-sm text-gray-500 mt-1">Maksimum 12 ay seçilebilir</p>
          </div>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {odemeDetaylari.map((detay, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">{index + 1}. Ay Ödeme Detayları</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900">Ödeme Tarihi</label>
                    <input 
                      type="date" 
                      value={detay.tarih} 
                      onChange={e => handleOdemeDetayChange(index, 'tarih', e.target.value)} 
                      required 
                      className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900">Ödeme Tutarı</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={detay.tutar} 
                      onChange={e => handleOdemeDetayChange(index, 'tutar', formatMoney(e.target.value))} 
                      required 
                      className="mt-1 w-full border rounded px-3 py-2 text-gray-900 font-semibold" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
        Geçmiş Giderleri Ekle
      </button>
    </form>
  );
} 