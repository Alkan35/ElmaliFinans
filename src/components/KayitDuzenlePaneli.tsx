import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, Timestamp, Query } from 'firebase/firestore';
import { FaEdit, FaCheck, FaTimes, FaTrash, FaDownload } from 'react-icons/fa';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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

interface Sozlesme {
    id: string;
    baslik: string;
    ndaUrl: string | null;
    sozlesmeUrl: string | null;
    createdAt: Timestamp;
}

export default function KayitDuzenlePaneli() {
  const [tab, setTab] = useState<'gelir' | 'gider' | 'sozlesme'>('gider');
  const [gelirler, setGelirler] = useState<Gelir[]>([]);
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [sozlesmeler, setSozlesmeler] = useState<Sozlesme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean, gider: Gider | null }>({ open: false, gider: null });
  const [editGelirModal, setEditGelirModal] = useState<{ open: boolean, gelir: Gelir | null }>({ open: false, gelir: null });
  const [editTaksitIndex, setEditTaksitIndex] = useState<number | null>(null);
  const [taksitEditCache, setTaksitEditCache] = useState<Partial<Taksit>>({});
  const [search, setSearch] = useState('');
  const [sozlesmeEditBaslik, setSozlesmeEditBaslik] = useState('');
  const [sozlesmeEditNdaFile, setSozlesmeEditNdaFile] = useState<File | null>(null);
  const [sozlesmeEditSozlesmeFile, setSozlesmeEditSozlesmeFile] = useState<File | null>(null);
  const [sozlesmeEditNdaUrl, setSozlesmeEditNdaUrl] = useState<string | null>(null);
  const [sozlesmeEditSozlesmeUrl, setSozlesmeEditSozlesmeUrl] = useState<string | null>(null);
  const [sozlesmeEditLoading, setSozlesmeEditLoading] = useState(false);
  const [sozlesmeEditError, setSozlesmeEditError] = useState<string | null>(null);
  const [editSozlesmeModal, setEditSozlesmeModal] = useState<{ open: boolean, sozlesme: Sozlesme | null }>({ open: false, sozlesme: null });

  useEffect(() => {
    // Tüm verileri çekme işlemini onSnapshot ile real-time yapalım
      setLoading(true);

    // Giderler listener
    const unsubscribeGiderler = onSnapshot(collection(db, 'giderler'), (snapshot) => {
      const fetchedGiderler = snapshot.docs.map(doc => ({
           ...doc.data(),
           id: doc.id,
      })) as Gider[];
      setGiderler(fetchedGiderler);
      // setLoading(false); // Bu satır kaldırıldı
    }, (error) => {
        console.error("Giderler çekilirken hata oluştu:", error);
         // setLoading(false); // Bu satır kaldırıldı
    });

    // Gelirler listener
    const unsubscribeGelirler = onSnapshot(collection(db, 'gelirler'), (snapshot) => {
      const fetchedGelirler = snapshot.docs.map(doc => ({
           ...doc.data(),
           id: doc.id,
      })) as Gelir[];
      setGelirler(fetchedGelirler);
       // setLoading(false); // Bu satır kaldırıldı
    }, (error) => {
        console.error("Gelirler çekilirken hata oluştu:", error);
        // setLoading(false); // Bu satır kaldırıldı
    });

    // Sözleşmeler listener eklendi
    const unsubscribeSozlesmeler = onSnapshot(collection(db, 'sozlesmeler'), (snapshot) => {
        const fetchedSozlesmeler = snapshot.docs.map(doc => ({
             ...doc.data(),
             id: doc.id,
        })) as Sozlesme[];
        setSozlesmeler(fetchedSozlesmeler);
         setLoading(false); // Tüm datalar çekilince loading false yapıldı
    }, (error) => {
        console.error("Sözleşmeler çekilirken hata oluştu:", error);
        setLoading(false); // Hata durumunda da loading false
    });


    // Cleanup function: component unmount edildiğinde listenerları kapat
    return () => {
      unsubscribeGiderler();
      unsubscribeGelirler();
      unsubscribeSozlesmeler();
    };
  }, []); // Boş dependency array: sadece ilk renderda çalışır

  // Sözleşme düzenleme modalı açıldığında state'leri doldur
  useEffect(() => {
      if (editSozlesmeModal.open && editSozlesmeModal.sozlesme) {
          setSozlesmeEditBaslik(editSozlesmeModal.sozlesme.baslik);
          setSozlesmeEditNdaUrl(editSozlesmeModal.sozlesme.ndaUrl);
          setSozlesmeEditSozlesmeUrl(editSozlesmeModal.sozlesme.sozlesmeUrl);
          setSozlesmeEditNdaFile(null); // Dosya inputlarını temizle
          setSozlesmeEditSozlesmeFile(null); // Dosya inputlarını temizle
          setSozlesmeEditError(null);
      }
  }, [editSozlesmeModal]);

  const handleSil = async (id: string, type: 'gider' | 'gelir' | 'sozlesme') => {
    if (typeof id !== 'string' || id.length === 0) {
        console.error(`Silme hatası: Geçersiz veya boş kayıt ID'si (${id}). Tip: ${typeof id}`);
        alert("Kaydı silerken bir hata oluştu: Geçersiz kayıt ID'si.");
        return;
    }
    if (!window.confirm(`Bu ${type} kaydını silmek istediğinize emin misiniz?`)) return;

    setLoading(true); // Silme işlemi sırasında loading

    try {
        console.log(`Silme işlemi başlatıldı: ID ${id}, Tip ${type}`);

        if (type === 'sozlesme') {
            // Sözleşme siliniyorsa önce Storage'daki dosyaları sil
            const sozlesmeToDelete = sozlesmeler.find(s => s.id === id);
            if (sozlesmeToDelete) {
                if (sozlesmeToDelete.ndaUrl) {
                    try {
                        // URL'den referans al
                        const ndaRef = ref(storage, sozlesmeToDelete.ndaUrl);
                        await deleteObject(ndaRef);
                        console.log("NDA dosyası başarıyla silindi.");
                    } catch (storageError: any) {
                        // Dosya yoksa veya başka bir hata varsa logla ama devam et
                        console.warn("Eski NDA dosyası silinirken hata oluştu (dosya mevcut olmayabilir):", storageError.message);
                    }
                }
                if (sozlesmeToDelete.sozlesmeUrl) {
                    try {
                        // URL'den referans al
                        const sozlesmeRef = ref(storage, sozlesmeToDelete.sozlesmeUrl);
                        await deleteObject(sozlesmeRef);
                         console.log("Sözleşme dosyası başarıyla silindi.");
                    } catch (storageError: any) {
                         console.warn("Eski Sözleşme dosyası silinirken hata oluştu (dosya mevcut olmayabilir):", storageError.message);
                    }
                }
            }
             // Firestore belgesini sil
             await deleteDoc(doc(db, 'sozlesmeler', id));

        } else {
             // Gider veya Gelir silme (mevcut mantık)
    await deleteDoc(doc(db, type === 'gider' ? 'giderler' : 'gelirler', id));
        }

        console.log(`Silme işlemi başarılı: ID ${id}`);

        // State güncellemeleri onSnapshot sayesinde otomatik olacak, manuel filtrelemeye gerek yok.
         alert('Kayıt başarıyla silindi!');
    } catch (error) {
        console.error(`Kaydı silerken hata oluştu (ID: ${id}, Tip: ${type}):`, error);
        alert('Kaydı silerken bir hata oluştu!');
    } finally {
        setLoading(false); // Silme işlemi bitince loading false
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

  const filteredSozlesmeler = sozlesmeler.filter(s =>
       (s.baslik || '').toLowerCase().includes(search.toLowerCase()) ||
        // Dosya URL'lerinde arama yapmak mantıklı değil, sadece başlık yeterli
       // Durum metinlerinde arama yapalım
      ('mevcut').includes(search.toLowerCase()) && (s.ndaUrl || s.sozlesmeUrl) ||
      ('mevcut değil').includes(search.toLowerCase()) && (!s.ndaUrl && !s.sozlesmeUrl)
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

   const handleSozlesmeEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editSozlesmeModal.sozlesme) return;

      setSozlesmeEditLoading(true);
      setSozlesmeEditError(null);

      const sozlesmeId = editSozlesmeModal.sozlesme.id;
      const sozlesmeDocRef = doc(db, 'sozlesmeler', sozlesmeId);
      let updatedNdaUrl = sozlesmeEditNdaUrl;
      let updatedSozlesmeUrl = sozlesmeEditSozlesmeUrl;

      try {
          // NDA dosyasını güncelle/yükle
          if (sozlesmeEditNdaFile) {
              // Eski dosyayı sil (varsa)
              if (sozlesmeEditNdaUrl) {
                  try {
                      // URL'den referans al
                      const oldNdaRef = ref(storage, sozlesmeEditNdaUrl);
                      await deleteObject(oldNdaRef);
                      console.log("Eski NDA dosyası silindi.");
                  } catch (storageError: any) {
                       // Dosya yoksa veya başka bir hata varsa logla ama devam et
                      console.warn("Eski NDA dosyası silinirken hata oluştu (dosya mevcut olmayabilir):", storageError.message);
                  }
              }
              // Yeni dosyayı yükle
              const newNdaRef = ref(storage, `sozlesmeler/nda/${sozlesmeId}-${sozlesmeEditNdaFile.name}`); // ID ekleyerek çakışmayı önle
              await uploadBytes(newNdaRef, sozlesmeEditNdaFile);
              updatedNdaUrl = await getDownloadURL(newNdaRef);
              console.log("Yeni NDA dosyası yüklendi. URL:", updatedNdaUrl);

          } else if (sozlesmeEditNdaUrl === null && editSozlesmeModal.sozlesme.ndaUrl) {
              // Kullanıcı mevcut NDA'yı kaldırdıysa (input boş ve daha önce URL vardıysa)
                if (editSozlesmeModal.sozlesme.ndaUrl) {
                    try {
                        const oldNdaRef = ref(storage, editSozlesmeModal.sozlesme.ndaUrl);
                        await deleteObject(oldNdaRef);
                        console.log("Mevcut NDA dosyası kaldırıldı.");
                    } catch (storageError: any) {
                        console.warn("Mevcut NDA dosyası kaldırılırken hata oluştu (dosya mevcut olmayabilir):", storageError.message);
                    }
                }
                updatedNdaUrl = null; // Firestore'da URL'yi temizle
          }


          // Sözleşme dosyasını güncelle/yükle
          if (sozlesmeEditSozlesmeFile) {
               // Eski dosyayı sil (varsa)
               if (sozlesmeEditSozlesmeUrl) {
                   try {
                       // URL'den referans al
                       const oldSozlesmeRef = ref(storage, sozlesmeEditSozlesmeUrl);
                       await deleteObject(oldSozlesmeRef);
                       console.log("Eski Sözleşme dosyası silindi.");
                   } catch (storageError: any) {
                        console.warn("Eski Sözleşme dosyası silinirken hata oluştu (dosya mevcut olmayabilir):", storageError.message);
                   }
               }
              // Yeni dosyayı yükle
              const newSozlesmeRef = ref(storage, `sozlesmeler/sozlesme/${sozlesmeId}-${sozlesmeEditSozlesmeFile.name}`); // ID ekleyerek çakışmayı önle
              await uploadBytes(newSozlesmeRef, sozlesmeEditSozlesmeFile);
              updatedSozlesmeUrl = await getDownloadURL(newSozlesmeRef);
              console.log("Yeni Sözleşme dosyası yüklendi. URL:", updatedSozlesmeUrl);

          } else if (sozlesmeEditSozlesmeUrl === null && editSozlesmeModal.sozlesme.sozlesmeUrl) {
             // Kullanıcı mevcut Sözleşme'yi kaldırdıysa
               if (editSozlesmeModal.sozlesme.sozlesmeUrl) {
                   try {
                       const oldSozlesmeRef = ref(storage, editSozlesmeModal.sozlesme.sozlesmeUrl);
                       await deleteObject(oldSozlesmeRef);
                       console.log("Mevcut Sözleşme dosyası kaldırıldı.");
                   } catch (storageError: any) {
                       console.warn("Mevcut Sözleşme dosyası kaldırılırken hata oluştu (dosya mevcut olmayabilir):", storageError.message);
                   }
               }
               updatedSozlesmeUrl = null; // Firestore'da URL'yi temizle
          }


          // Firestore belgesini güncelle
          await updateDoc(sozlesmeDocRef, {
              baslik: sozlesmeEditBaslik,
              ndaUrl: updatedNdaUrl,
              sozlesmeUrl: updatedSozlesmeUrl,
              // createdAt güncellenmez
          });

          alert('Sözleşme başarıyla güncellendi!');
          setEditSozlesmeModal({ open: false, sozlesme: null }); // Modalı kapat
      } catch (error: any) {
          console.error('Sözleşme güncellenirken hata oluştu:', error);
          setSozlesmeEditError(`Güncelleme sırasında hata: ${error.message}`);
      } finally {
          setSozlesmeEditLoading(false);
      }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold mb-4">Kayıtları Düzenle</h2>

      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === 'gider' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setTab('gider')}
          >
            Giderler
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === 'gelir' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setTab('gelir')}
          >
            Gelirler
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === 'sozlesme' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setTab('sozlesme')}
          >
            Sözleşmeler
          </button>
        </nav>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={`Aranacak kelimeyi girin (${tab === 'gider' ? 'Gider Adı, Başlık, Alt Başlık, Tutar, Durum' : tab === 'gelir' ? 'Gelir Adı, Başlık, Tür, Tutar, Kalan Ay, Tarih, Durum' : 'Sözleşme Başlığı'})`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          {tab === 'gider' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alt Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
                <tbody className="bg-white divide-y divide-gray-200">
              {filteredGiderler.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">Gider bulunamadı.</td></tr>
              ) : (
                filteredGiderler.map(gider => (
                      <tr key={gider.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gider.ad}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gider.baslik}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gider.altBaslik}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{displayMoney(gider.tutar)}</td>
                         <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${gider.durum === 'ödendi' ? 'text-green-600' : 'text-red-600'}`}>
                            {gider.durum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setEditModal({ open: true, gider: gider })} className="text-blue-600 hover:text-blue-900 mr-4"><FaEdit /></button>
                          <button onClick={() => handleSil(gider.id, 'gider')} className="text-red-600 hover:text-red-900"><FaTrash /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          )}

          {tab === 'gelir' && (
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad/Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beklenen Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kalan Ay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
                <tbody className="bg-white divide-y divide-gray-200">
              {filteredGelirler.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">Gelir bulunamadı.</td></tr>
              ) : (
                filteredGelirler.map(gelir => (
                      <tr key={gelir.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gelir.ad || gelir.baslik}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gelir.tur}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{displayMoney(gelir.tutar || gelir.toplamTutar)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gelir.odemeBeklenenTarih ? formatTarih(gelir.odemeBeklenenTarih) : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gelir.odemeTarihi ? formatTarih(gelir.odemeTarihi) : '-'}</td>
                         <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${gelir.durum === 'tahsilEdildi' ? 'text-green-600' : gelir.durum === 'kesinlesen' ? 'text-blue-600' : 'text-red-600'}`}>
                            {gelir.durum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeof gelir.kalanAy === 'number' ? gelir.kalanAy : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setEditGelirModal({ open: true, gelir: gelir })} className="text-blue-600 hover:text-blue-900 mr-4"><FaEdit /></button>
                          <button onClick={() => handleSil(gelir.id, 'gelir')} className="text-red-600 hover:text-red-900"><FaTrash /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
                      </div>
          )}

           {tab === 'sozlesme' && (
               <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                           <tr>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sözleşme Başlığı</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NDA</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sözleşme</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eklenme Tarihi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                           {filteredSozlesmeler.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">Sözleşme bulunamadı.</td></tr>
                           ) : (
                                filteredSozlesmeler.map(sozlesme => (
                                   <tr key={sozlesme.id} className="hover:bg-gray-50">
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sozlesme.baslik}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {sozlesme.ndaUrl ? (
                                                <span className="text-green-600 flex items-center"><FaCheck className="mr-1"/> Mevcut</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center"><FaTimes className="mr-1"/> Mevcut değil</span>
                                            )}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {sozlesme.sozlesmeUrl ? (
                                                <span className="text-green-600 flex items-center"><FaCheck className="mr-1"/> Mevcut</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center"><FaTimes className="mr-1"/> Mevcut değil</span>
                                            )}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                           {sozlesme.createdAt?.toDate().toLocaleDateString('tr-TR')}
                                       </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setEditModal({ open: true, gider: sozlesme as Gider })}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                title="Düzenle"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleSil(sozlesme.id, 'sozlesme')}
                                                className="text-red-600 hover:text-red-900"
                                                title="Sil"
                                            >
                                                <FaTrash />
                                            </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

        </>
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

      {editSozlesmeModal.open && editSozlesmeModal.sozlesme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-lg w-full"> {/* Modal Boyutu ayarlayabilirsiniz */}
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Sözleşmeyi Düzenle</h2>
                      <button onClick={() => setEditSozlesmeModal({ open: false, sozlesme: null })} className="text-gray-500 hover:text-gray-800">
                          <FaTimes size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleSozlesmeEditSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Sözleşme Başlığı</label>
                          <input
                               type="text"
                               value={sozlesmeEditBaslik}
                               onChange={(e) => setSozlesmeEditBaslik(e.target.value)}
                               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                               required
                          />
                      </div>

                      {/* Mevcut NDA Durumu ve Dosya Seçme */}
                      <div>
                           <label className="block text-sm font-medium text-gray-700">NDA Dosyası (PDF/Word)</label>
                           {sozlesmeEditNdaUrl && (
                               <div className="flex items-center text-sm text-gray-600 mb-2">
                                   <span className="mr-2">Mevcut: <a href={sozlesmeEditNdaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">İndir <FaDownload className="inline ml-1"/></a></span>
                                   <button type="button" onClick={() => setSozlesmeEditNdaUrl(null)} className="text-red-600 hover:text-red-800 text-xs">Kaldır</button>
                               </div>
                           )}
                          <input
                               type="file"
                               accept=".pdf,.doc,.docx"
                               onChange={(e) => setSozlesmeEditNdaFile(e.target.files?.[0] || null)}
                               className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                           {sozlesmeEditNdaFile && (
                               <p className="mt-1 text-sm text-gray-500">Yeni dosya seçildi: {sozlesmeEditNdaFile.name}</p>
                           )}
                      </div>

                      {/* Mevcut Sözleşme Durumu ve Dosya Seçme */}
                       <div>
                            <label className="block text-sm font-medium text-gray-700">Sözleşme Dosyası (PDF/Word)</label>
                            {sozlesmeEditSozlesmeUrl && (
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                   <span className="mr-2">Mevcut: <a href={sozlesmeEditSozlesmeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">İndir <FaDownload className="inline ml-1"/></a></span>
                                   <button type="button" onClick={() => setSozlesmeEditSozlesmeUrl(null)} className="text-red-600 hover:text-red-800 text-xs">Kaldır</button>
                                </div>
                            )}
                           <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setSozlesmeEditSozlesmeFile(e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                           />
                            {sozlesmeEditSozlesmeFile && (
                               <p className="mt-1 text-sm text-gray-500">Yeni dosya seçildi: {sozlesmeEditSozlesmeFile.name}</p>
                            )}
                       </div>


                      {sozlesmeEditError && (
                          <div className="text-red-500 text-sm">{sozlesmeEditError}</div>
                      )}

                      <div className="flex justify-end space-x-3">
                          <button
                               type="button"
                               onClick={() => setEditSozlesmeModal({ open: false, sozlesme: null })}
                               className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                              İptal
                          </button>
                          <button
                               type="submit"
                               disabled={sozlesmeEditLoading}
                               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                              {sozlesmeEditLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
} 