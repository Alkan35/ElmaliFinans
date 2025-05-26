import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';

function formatTarih(dateInput: Date | string | Timestamp | undefined | null): string {
    if (!dateInput) return '-';
    try {
        let d: Date;
        if (dateInput instanceof Timestamp) {
            d = dateInput.toDate();
        } else if (typeof dateInput === 'string') {
             // YYYY-MM-DD veya GG.AA.YYYY formatlarını denemek için daha esnek
            const parts = dateInput.split('-');
            if (parts.length === 3) { // YYYY-MM-DD
                 // UTC olarak ayrıştırmak daha güvenli
                 d = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
            } else { // Başka format olabilir, direkt parse etmeyi dene
                 d = new Date(dateInput);
            }
        } else if (dateInput instanceof Date) {
             d = dateInput;
        } else {
            return '-'; // Desteklenmeyen tip
        }

        if (isNaN(d.getTime())) return '-'; // Geçersiz tarih kontrolü

        // Yerel saat diliminde GG.AA.YYYY formatı
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        return `${day}.${month}.${year}`;
    } catch (error) {
        console.error("Tarih formatlama hatası:", error, "Giriş:", dateInput);
        return '-';
    }
}

interface Gider {
  id: string;
  ad: string;
  baslik: string;
  altBaslik: string;
  tarih?: string;
  tutar: number;
  durum: string;
  tur?: string;
  maasGunu?: number;
  odemeTarihi?: string;
}

interface Taksit {
  sira: number;
  isim: string;
  yuzde: number;
  tutar: number;
  odendi: boolean;
  odemeTarihi?: Date | string | Timestamp;
  beklenenOdemeAyi?: number;
  beklenenOdemeYili?: number;
}

interface Gelir {
  id: string;
  ad?: string;
  baslik: string;
  tur: 'tekSeferlik' | 'taksitli' | 'aylikHizmet';
  tutar: number;
  toplamTutar?: number;
  paraBirimi: string;
  odemeTuru?: string;
  taksitSayisi?: number;
  taksitler?: Taksit[];
  durum: 'bekleniyor' | 'kesinlesen' | 'tahsilEdildi';
  createdAt: Timestamp;
  odemeBeklenenTarih?: string;
  odemeTarihi?: string;
  kalanAy?: number;
  toplamOdenenTutar?: number;
}

function toDateIfPossibleAndFormat(dt: any): string | undefined {
  if (!dt) return undefined;
  try {
     let d: Date;
     if (dt instanceof Timestamp) {
         d = dt.toDate();
     } else if (typeof dt === 'string') {
          // YYYY-MM-DD stringini Date objesine çevir
          const parts = dt.split('-');
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
     } else if (dt instanceof Date) {
          d = dt;
     } else {
         return undefined; // Desteklenmeyen tip
     }

     if (isNaN(d.getTime())) return undefined; // Geçersiz tarih kontrolü

     const day = d.getDate().toString().padStart(2, '0');
     const month = (d.getMonth() + 1).toString().padStart(2, '0');
     const year = d.getFullYear();

     return `${day}.${month}.${year}`; // GG.AA.YYYY formatı
  } catch (error) {
    console.error("toDateIfPossibleAndFormat hatası:", error);
    return undefined;
  }
}

function displayMoney(value: number | string | undefined | null): string {
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

export default function KayitDuzenlePaneli() {
  const [tab, setTab] = useState<'gelir' | 'gider'>('gider');
  const [gelirler, setGelirler] = useState<Gelir[]>([]);
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean, gider: Gider | null }>({ open: false, gider: null });
  const [editGelirModal, setEditGelirModal] = useState<{ open: boolean, gelir: Gelir | null }>({ open: false, gelir: null });
  const [editTaksitIndex, setEditTaksitIndex] = useState<number | null>(null);
  const [taksitEditCache, setTaksitEditCache] = useState<Partial<Taksit>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
          // Gelir verilerini çek ve sağlam ID'li olanları filtrele
          const gelirSnap = await getDocs(collection(db, 'gelirler'));
          console.log("Firestore'dan Çekilen Ham Gelir Docs Sayısı:", gelirSnap.docs.length);

          const fetchedGelirler = gelirSnap.docs
            .map(doc => {
                const data = doc.data();
                console.log(`Mapping Gelir Doc - Raw Doc ID: "${doc.id}", Type: ${typeof doc.id}`, "Raw Data:", data);
                const processedData = {
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
                    odemeTarihi: typeof data.odemeTarihi === 'string' ? data.odemeTarihi : undefined,
                    odemeBeklenenTarih: typeof data.odemeBeklenenTarih === 'string' ? data.odemeBeklenenTarih : undefined,
                    taksitler: Array.isArray(data.taksitler) ? data.taksitler.map((t: any) => ({
                        ...t,
                        odemeTarihi: t.odemeTarihi ? (t.odemeTarihi instanceof Timestamp ? formatTarih(t.odemeTarihi) : (typeof t.odemeTarihi === 'string' ? t.odemeTarihi : undefined)) : undefined
                    })) : undefined,
                    id: doc.id as string,
                };
                console.log(`Mapped Gelir Obj - ID: "${processedData.id}"`, processedData);
                return processedData as Gelir;
            })
            .filter(gelir => typeof gelir.id === 'string' && gelir.id.length > 0);

          console.log("Çekilen ve Filtrelenen Gelir Sayısı:", fetchedGelirler.length);
          console.log("Çekilen ve Filtrelenen Gelir ID'leri:", fetchedGelirler.map(g => g.id));

          setGelirler(fetchedGelirler);

          // Gider verilerini çek ve sağlam ID'li olanları filtrele
          const giderSnap = await getDocs(collection(db, 'giderler'));
          console.log("Firestore'dan Çekilen Ham Gider Docs Sayısı:", giderSnap.docs.length);

          const fetchedGiderler = giderSnap.docs
            .map(doc => {
                 const data = doc.data();
                 console.log(`Mapping Gider Doc - Raw Doc ID: "${doc.id}", Type: ${typeof doc.id}`, "Raw Data:", data);
                 const processedData = {
                    ...data,
                    id: doc.id as string,
                 };
                 console.log(`Mapped Gider Obj - ID: "${processedData.id}"`, processedData);
                 return processedData as Gider;
            })
            .filter(gider => typeof gider.id === 'string' && gider.id.length > 0);

          console.log("Çekilen ve Filtrelenen Gider Sayısı:", fetchedGiderler.length);
          console.log("Çekilen ve Filtrelenen Gider ID'leri:", fetchedGiderler.map(g => g.id));

          setGiderler(fetchedGiderler);

          setLoading(false);
      } catch (err) {
          console.error("Veri çekilirken hata oluştu:", err);
          setLoading(false);
          alert("Veri çekilirken bir hata oluştu. Konsolu kontrol edin.");
      }
    }
    fetchData();
  }, []);

  const handleSil = async (id: string, type: 'gider' | 'gelir') => {
    if (typeof id !== 'string' || id.length === 0) {
        console.error(`Silme hatası: Geçersiz veya boş kayıt ID'si (${id}). Tip: ${typeof id}`);
        alert("Kaydı silerken bir hata oluştu: Geçersiz kayıt ID'si.");
        return;
    }
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
        console.log(`Silme işlemi başlatıldı: ID ${id}, Tip ${type}`);
        await deleteDoc(doc(db, type === 'gider' ? 'giderler' : 'gelirler', id));
        console.log(`Silme işlemi başarılı: ID ${id}`);

        if (type === 'gider') {
          setGiderler(giderler => giderler.filter(g => g.id !== id));
        } else {
           setGelirler(gelirler => gelirler.filter(g => g.id !== id));
        }
         alert('Kayıt başarıyla silindi!');
    } catch (error) {
        console.error(`Kaydı silerken hata oluştu (ID: ${id}):`, error);
        alert('Kaydı silerken bir hata oluştu!');
    }
  };

  const filteredGiderler = giderler.filter(g =>
     (g.ad || '').toLowerCase().includes(search.toLowerCase()) ||
     (g.baslik || '').toLowerCase().includes(search.toLowerCase()) ||
     (g.altBaslik || '').toLowerCase().includes(search.toLowerCase()) ||
     displayMoney(g.tutar).toLowerCase().includes(search.toLowerCase()) ||
     (g.durum || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredGelirler = gelirler.filter(g =>
      (g.ad || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.baslik || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.tur || '').toLowerCase().includes(search.toLowerCase()) ||
      displayMoney(g.tutar || g.toplamTutar).toLowerCase().includes(search.toLowerCase()) ||
      (typeof g.kalanAy === 'number' && String(g.kalanAy).includes(search)) ||
      (g.odemeBeklenenTarih && formatTarih(g.odemeBeklenenTarih).toLowerCase().includes(search.toLowerCase())) ||
      (g.odemeTarihi && formatTarih(g.odemeTarihi).toLowerCase().includes(search.toLowerCase())) ||
      (g.durum || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleGiderEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModal.gider || typeof editModal.gider.id !== 'string' || editModal.gider.id.length === 0) {
             console.error("Gider düzenleme hatası: Geçersiz veya boş kayıt ID'si.");
             alert("Gideri güncellerken bir hata oluştu: Geçersiz kayıt ID'si.");
             return;
        }

        try {
            console.log("Gider güncelleme başlatıldı:", editModal.gider.id, editModal.gider);
            const giderDocRef = doc(db, 'giderler', editModal.gider.id);
            await updateDoc(giderDocRef, {
                 ad: editModal.gider.ad || null,
                 baslik: editModal.gider.baslik || null,
                 altBaslik: editModal.gider.altBaslik || null,
                 tutar: Number(String(editModal.gider.tutar || 0).replace(/\D/g, '')),
                 durum: editModal.gider.durum || null,
            });
            console.log("Gider güncelleme başarılı:", editModal.gider.id);

            setGiderler(giderler => giderler.map(g => g.id === editModal.gider?.id ? editModal.gider : g));
            alert('Gider başarıyla güncellendi!');
            setEditModal({ open: false, gider: null });
        } catch (error) {
            console.error(`Gider güncellenirken hata oluştu (ID: ${editModal.gider?.id}):`, error);
            alert('Gider güncellenirken bir hata oluştu!');
        }
   };

   const handleGelirEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editGelirModal.gelir || typeof editGelirModal.gelir.id !== 'string' || editGelirModal.gelir.id.length === 0) {
            console.error("Gelir düzenleme hatası: Geçersiz veya boş kayıt ID'si.");
            alert("Geliri güncellerken bir hata oluştu: Geçersiz kayıt ID'si.");
            return;
        }

        try {
            console.log("Gelir güncelleme başlatıldı:", editGelirModal.gelir.id, editGelirModal.gelir);
            const gelirDocRef = doc(db, 'gelirler', editGelirModal.gelir.id);
             await updateDoc(gelirDocRef, {
                 ad: editGelirModal.gelir.ad || null,
                 baslik: editGelirModal.gelir.baslik || null,
                 tur: editGelirModal.gelir.tur || null,
                 tutar: Number(String(editGelirModal.gelir.tutar || 0).replace(/\D/g, '')),
                 toplamTutar: Number(String(editGelirModal.gelir.tutar || editGelirModal.gelir.toplamTutar || 0).replace(/\D/g, '')),
                 durum: editGelirModal.gelir.durum || null,
            });
             console.log("Gelir güncelleme başarılı:", editGelirModal.gelir.id);

            setGelirler(gelirler => gelirler.map(g => g.id === editGelirModal.gelir?.id ? editGelirModal.gelir : g));

            alert('Gelir başarıyla güncellendi!');
            setEditGelirModal({ open: false, gelir: null });
        } catch (error) {
            console.error(`Gelir güncellenirken hata oluştu (ID: ${editGelirModal.gelir?.id}):`, error);
            alert('Gelir güncellenirken bir hata oluştu!');
        }
   };

  return (
    <div className="w-full">
      <div className="flex gap-8 border-b mb-6">
        <button className={`pb-2 ${tab==='gider' ? 'border-b-2 border-green-600 text-green-700 font-bold' : 'text-gray-500 hover:text-green-600'}`} onClick={()=>setTab('gider')}>Giderler</button>
        <button className={`pb-2 ${tab==='gelir' ? 'border-b-2 border-green-600 text-green-700 font-bold' : 'text-gray-500 hover:text-green-600'}`} onClick={()=>setTab('gelir')}>Gelirler</button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-64"
        />
      </div>
      {loading ? (
        <div className="text-gray-500 py-12 text-center">Yükleniyor...</div>
      ) : tab === 'gider' ? (
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="text-xs bg-green-100 text-green-800 uppercase">
                <th className="px-4 py-2 font-bold text-left">Gider Adı</th>
                <th className="px-4 py-2 font-bold text-left">Başlık</th>
                <th className="px-4 py-2 font-bold text-left">Alt Başlık</th>
                <th className="px-4 py-2 font-bold text-right">Tutar</th>
                <th className="px-4 py-2 font-bold text-left">Durum</th>
                <th className="px-4 py-2 font-bold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredGiderler.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Kayıtlı gider yok.</td></tr>
              ) : (
                filteredGiderler.map(gider => (
                  <tr key={gider.id} className="text-center border-b hover:bg-green-50 transition group">
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">{gider.ad || '-'}</td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">{gider.baslik || '-'}</td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">{gider.altBaslik || '-'}</td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-right">{displayMoney(gider.tutar)}</td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">{gider.durum || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center items-center gap-2 min-h-[40px] min-w-[120px]">
                        <button title="Düzenle" className={`p-2 rounded-full ${typeof gider.id === 'string' && gider.id.length > 0 ? 'bg-blue-900 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white transition`} onClick={() => typeof gider.id === 'string' && gider.id.length > 0 && setEditModal({ open: true, gider: gider })} disabled={typeof gider.id !== 'string' || gider.id.length === 0}><FaEdit /></button>
                        <button title="Sil" className={`p-2 rounded-full ${typeof gider.id === 'string' && gider.id.length > 0 ? 'bg-blue-900 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'} text-white transition`} onClick={() => typeof gider.id === 'string' && gider.id.length > 0 && handleSil(gider.id, 'gider')} disabled={typeof gider.id !== 'string' || gider.id.length === 0}><FaTimes /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="text-xs bg-green-100 text-green-800 uppercase">
                <th className="px-4 py-2 font-bold text-left">Gelir Adı</th>
                <th className="px-4 py-2 font-bold text-left">Ödeme Türü</th>
                <th className="px-4 py-2 font-bold text-right">Tutar</th>
                <th className="px-4 py-2 font-bold text-left">Durum</th>
                <th className="px-4 py-2 font-bold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredGelirler.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Kayıtlı gelir yok.</td></tr>
              ) : (
                filteredGelirler.map(gelir => (
                  <tr key={gelir.id} className="text-center border-b hover:bg-green-50 transition group">
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">{gelir.ad || gelir.baslik || '-'}</td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">
                      {gelir.tur === 'tekSeferlik' ? 'Tek Ödeme' : gelir.tur === 'taksitli' ? 'Taksitli Ödeme' : gelir.tur === 'aylikHizmet' ? 'Aylık Hizmet' : gelir.tur || '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-right">{displayMoney(gelir.tutar || gelir.toplamTutar)}</td>
                    <td className="px-4 py-2 text-gray-900 font-semibold text-left">
                      {gelir.durum === 'tahsilEdildi' ? 'Gerçekleşen' : gelir.durum === 'bekleniyor' ? 'Bekleyen' : gelir.durum === 'kesinlesen' ? 'Kesinleşen' : gelir.durum || '-'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center items-center gap-2 min-h-[40px] min-w-[120px]">
                        <button title="Düzenle" className={`p-2 rounded-full ${typeof gelir.id === 'string' && gelir.id.length > 0 ? 'bg-blue-900 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white transition`} onClick={() => typeof gelir.id === 'string' && gelir.id.length > 0 && setEditGelirModal({ open: true, gelir: gelir })} disabled={typeof gelir.id !== 'string' || gelir.id.length === 0}><FaEdit /></button>
                        <button title="Sil" className={`p-2 rounded-full ${typeof gelir.id === 'string' && gelir.id.length > 0 ? 'bg-blue-900 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'} text-white transition`} onClick={() => typeof gelir.id === 'string' && gelir.id.length > 0 && handleSil(gelir.id, 'gelir')} disabled={typeof gelir.id !== 'string' || gelir.id.length === 0}><FaTimes /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {editModal.open && editModal.gider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center tracking-tight">Gideri Düzenle</h3>
            <form onSubmit={handleGiderEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Gider Adı</label>
                <input value={editModal.gider.ad || ''} onChange={e => setEditModal(m => ({ ...m, gider: { ...m.gider!, ad: e.target.value } }))} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Başlık</label>
                <input value={editModal.gider.baslik || ''} onChange={e => setEditModal(m => ({ ...m, gider: { ...m.gider!, baslik: e.target.value } }))} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Alt Başlık</label>
                <input value={editModal.gider.altBaslik || ''} onChange={e => setEditModal(m => ({ ...m, gider: { ...m.gider!, altBaslik: e.target.value } }))} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Tutar</label>
                <input type="text" inputMode="numeric" value={String(editModal.gider.tutar || '')} onChange={e => {
                     const rawValue = e.target.value.replace(/\D/g, '');
                     setEditModal(m => ({ ...m, gider: { ...m.gider!, tutar: Number(rawValue) } }));
                }} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Durum</label>
                <select value={editModal.gider.durum || ''} onChange={e => setEditModal(m => ({ ...m, gider: { ...m.gider!, durum: e.target.value } }))} className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold">
                  <option value="Bekleyen">Bekleyen</option>
                  <option value="Kesinleşen">Kesinleşen</option>
                  <option value="Ödendi">Ödendi</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setEditModal({ open: false, gider: null })} className="px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-700 font-semibold">İptal</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editGelirModal.open && editGelirModal.gelir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg min-w-[400px] border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center tracking-tight">Geliri Düzenle</h3>
            <form onSubmit={handleGelirEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Gelir Adı</label>
                <input value={editGelirModal.gelir.ad || ''} onChange={e => setEditGelirModal(m => ({ ...m, gelir: { ...m.gelir!, ad: e.target.value } }))} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Tutar (TL)</label>
                <input type="text" inputMode="numeric" value={String(editGelirModal.gelir.tutar || editGelirModal.gelir.toplamTutar || '')} onChange={e => {
                     const rawValue = e.target.value.replace(/\D/g, '');
                     const numValue = Number(rawValue);
                     setEditGelirModal(m => ({ ...m, gelir: { ...m.gelir!, tutar: numValue, toplamTutar: numValue } }));
                }} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Ödeme Türü</label>
                <select value={editGelirModal.gelir.tur || ''} onChange={e => setEditGelirModal(m => ({ ...m, gelir: { ...m.gelir!, tur: e.target.value as Gelir['tur'] } }))} required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold">
                  <option value="tekSeferlik">Tek Ödeme</option>
                  <option value="taksitli">Taksitli Ödeme</option>
                  <option value="aylikHizmet">Aylık Hizmet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Durum</label>
                <select value={editGelirModal.gelir.durum || ''} onChange={e => setEditGelirModal(m => ({ ...m, gelir: { ...m.gelir!, durum: e.target.value as Gelir['durum'] } }))} className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-semibold">
                  <option value="bekleniyor">Bekleniyor</option>
                  <option value="kesinlesen">Kesinleşen</option>
                  <option value="tahsilEdildi">Gerçekleşen</option>
                </select>
              </div>
              {Array.isArray(editGelirModal.gelir.taksitler) && editGelirModal.gelir.taksitler.length > 0 && (
                <div className="mt-6">
                  <div className="font-bold text-gray-900 mb-2">Taksitler</div>
                  <div className="w-full max-h-40 overflow-y-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-xl shadow bg-white">
                      <thead>
                        <tr className="bg-white border-b border-gray-200">
                          <th className="px-3 py-2 font-bold text-gray-800 text-base text-center">#</th>
                          <th className="px-3 py-2 font-bold text-gray-800 text-base text-left">İsim</th>
                          <th className="px-3 py-2 font-bold text-gray-800 text-base text-right">Yüzde</th>
                          <th className="px-3 py-2 font-bold text-gray-800 text-base text-right">Tutar</th>
                          <th className="px-3 py-2 font-bold text-gray-800 text-base text-left">Ödeme Tarihi</th>
                          <th className="px-3 py-2 font-bold text-gray-800 text-base text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editGelirModal.gelir.taksitler.map((taksit, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition">
                            <td className="px-3 py-2 text-center">{taksit.sira}</td>
                            <td className="px-3 py-2 text-left">{taksit.isim || '-'}</td>
                            <td className="px-3 py-2 text-right">{typeof taksit.yuzde === 'number' ? taksit.yuzde.toFixed(2) + '%' : '-'}</td>
                            <td className="px-3 py-2 text-right">{displayMoney(taksit.tutar)}</td>
                            <td className="px-3 py-2 text-left">{formatTarih(taksit.odemeTarihi) || '-'}</td>
                            <td className="px-3 py-2 text-center">{taksit.odendi ? 'Ödendi' : 'Bekliyor'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setEditGelirModal({ open: false, gelir: null })} className="px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-700 font-semibold">İptal</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 