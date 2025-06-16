import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHeaderCell, 
  TableCell, 
  StatusBadge, 
  ActionButton 
} from '@/components/TableUtils';
import GiderOdemeModal from '@/components/GiderOdemeModal';

interface AltBaslik {
  id: string;
  isim: string;
}
interface AnaBaslik {
  id: string;
  isim: string;
  altBasliklar: AltBaslik[];
}

interface Gider {
  id: string;
  ad?: string;
  baslik?: string;
  altBaslik?: string;
  tarih?: string;
  tutar?: number;
  durum?: string;
  tur?: string;
  maasGunu?: number;
  odemeTarihi?: string;
  kalanAy?: number;
  toplamAy?: number;
  sonOdemeTarihi?: string;
  odendi?: boolean;
  createdAt?: Timestamp;
  parentId?: string;
}

export default function GiderlerTable() {
  const [tab, setTab] = useState('tum');
  const [tumGiderler, setTumGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatusInput, setFilterStatusInput] = useState('');
  const [filterBaslikInput, setFilterBaslikInput] = useState('');
  const [filterAltBaslikInput, setFilterAltBaslikInput] = useState('');
  const [filterAyInput, setFilterAyInput] = useState('');

  const [appliedFilterStatus, setAppliedFilterStatus] = useState('');
  const [appliedFilterBaslik, setAppliedFilterBaslik] = useState('');
  const [appliedFilterAltBaslik, setAppliedFilterAltBaslik] = useState('');
  const [appliedFilterAy, setAppliedFilterAy] = useState('');

  const [basliklar, setBasliklar] = useState<AnaBaslik[]>([]);
  const [loadingBasliklar, setLoadingBasliklar] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;

  // Gider ödeme modal state'leri
  const [isGiderOdemeModalOpen, setIsGiderOdemeModalOpen] = useState(false);
  const [selectedGider, setSelectedGider] = useState<Gider | null>(null);

  useEffect(() => {
    const fetchBasliklar = async () => {
      setLoadingBasliklar(true);
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
      setLoadingBasliklar(false);
    };
    fetchBasliklar();
  }, []);

  const fetchTumGiderler = () => {
    setLoading(true);
    console.log("Setting up real-time listener for tumGiderler...");
    
    try {
      const q = query(collection(db, 'giderler'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const createdAtTimestamp = data.createdAt instanceof Timestamp ? data.createdAt : (data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : Timestamp.now());
          return {
            id: doc.id,
            ad: data.ad || '',
            baslik: data.baslik || '',
            altBaslik: data.altBaslik || '',
            tarih: data.tarih || '',
            tutar: typeof data.tutar === 'number' ? data.tutar : 0,
            durum: data.durum || '',
            tur: data.tur || '',
            maasGunu: typeof data.maasGunu === 'number' ? data.maasGunu : undefined,
            odemeTarihi: data.odemeTarihi || '',
            kalanAy: typeof data.kalanAy === 'number' ? data.kalanAy : undefined,
            toplamAy: typeof data.toplamAy === 'number' ? data.toplamAy : undefined,
            sonOdemeTarihi: data.sonOdemeTarihi || '',
            odendi: typeof data.odendi === 'boolean' ? data.odendi : false,
            createdAt: createdAtTimestamp,
            parentId: data.parentId || undefined,
          } as Gider;
        });
        setTumGiderler(fetchedData);
        console.log("Successfully updated tumGiderler.", fetchedData.length, "items.");
        setLoading(false);
      }, (error) => {
        console.error("Error in real-time listener:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up real-time listener:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchTumGiderler();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const compareDates = (date1: string | Timestamp | undefined, date2: string | Timestamp | undefined, order: 'asc' | 'desc') => {
    const getTime = (date: string | Timestamp | undefined): number => {
        if (!date) return 0;
        if (date instanceof Timestamp) {
            return date.toDate().getTime();
        }
        if (typeof date === 'string') {
            const d = new Date(date);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        return 0;
    };

    const d1 = getTime(date1);
    const d2 = getTime(date2);

    if (order === 'asc') {
      return d1 - d2;
    } else {
      return d2 - d1;
    }
  };

   const getLatestDate = (date1: string | Timestamp | undefined, date2: string | Timestamp | undefined): string | Timestamp | undefined => {
        const time1 = compareDates(date1, undefined, 'desc');
        const time2 = compareDates(date2, undefined, 'desc');

        if (time1 === 0 && time2 === 0) return undefined;
        if (time1 >= time2) return date1;
        return date2;
   };

  function formatTarih(tarih: string | Date | Timestamp | { toDate?: () => Date } | undefined): string {
    if (!tarih) return '-';
    let d: Date;

    if (tarih instanceof Date) {
      d = tarih;
    } else if (tarih instanceof Timestamp) {
      d = tarih.toDate();
    } else if (typeof tarih === 'string') {
       // Hem GG/AA/YYYY hem de YYYY-MM-DD formatlarını ayrıştırmayı deneyelim
       const partsSlash = tarih.split('/');
       const partsDash = tarih.split('-');

       if (partsSlash.length === 3) {
           // GG/AA/YYYY formatı için: Gün, Ay(1-indexed), Yıl
           const gun = parseInt(partsSlash[0], 10);
           const ay = parseInt(partsSlash[1], 10) - 1; // Date nesnesinde ay 0-indexed
           const yil = parseInt(partsSlash[2], 10);
           // Yerel saat diliminde Date objesi oluştur
           d = new Date(yil, ay, gun);
       } else if (partsDash.length === 3) {
            // YYYY-MM-DD formatı için: Yıl, Ay(1-indexed), Gün
           const yil = parseInt(partsDash[0], 10);
           const ay = parseInt(partsDash[1], 10) - 1; // Date nesnesinde ay 0-indexed
           const gun = parseInt(partsDash[2], 10);
           // YYYY-MM-DD formatı zaten Date tarafından doğru yorumlanır, ancak tutarlılık için elle ayrıştırma daha güvenli
            d = new Date(yil, ay, gun); // Veya new Date(`${yil}-${ay+1}-${gun}T12:00:00Z`) gibi daha belirgin bir saat dilimi/saat ile
       }
       else {
           // Bilinmeyen formatlar veya geçersiz stringler için fallback
           d = new Date(tarih);
       }

       // Oluşturulan Date objesinin geçerli olup olmadığını kontrol et
       if (isNaN(d.getTime())) {
           console.warn("formatTarih: Geçersiz tarih stringi veya formatı:", tarih);
           return '-'; // Geçersiz tarih durumunda '-' döndür
       }
    }
     else {
      console.warn("formatTarih: Desteklenmeyen tarih tipi:", typeof tarih);
      return '-'; // Desteklenmeyen tipte '-' döndür
    }

    // Date objesini alıp GG/AA/YYYY formatında string olarak geri döndür
    const gun = d.getDate().toString().padStart(2, '0');
    const ay = (d.getMonth() + 1).toString().padStart(2, '0'); // Ayı 1-indexed yap
    const yil = d.getFullYear();
    return `${gun}/${ay}/${yil}`;
  }

  const handleOde = (gider: Gider) => {
    setSelectedGider(gider);
    setIsGiderOdemeModalOpen(true);
  };

  const filteredAndSortedGiderler = useMemo(() => {
    console.log("Filtering and sorting data...", {tab, searchQuery, appliedFilterStatus, appliedFilterBaslik, appliedFilterAltBaslik, appliedFilterAy});
    console.log("tumGiderler type:", typeof tumGiderler, "isArray:", Array.isArray(tumGiderler), "length:", tumGiderler.length);

    try {
      if (!Array.isArray(tumGiderler) || tumGiderler.length === 0) {
            console.log("tumGiderler is not an array or is empty, returning [].");
            return [];
       }

      let filtered = tumGiderler.filter(gider => {
        if (!gider) {
          console.warn("Encountered a null or undefined gider object during initial filtering.", gider);
          return false;
        }

        if (tab === 'gerceklesen') return gider.durum === 'gerceklesen' || gider.odendi === true;
        if (tab === 'kesinlesen') return gider.durum !== 'gerceklesen' && gider.odendi === false;
        return true;
      });

      const lowerCaseSearchQuery = searchQuery.toLowerCase();

      filtered = filtered.filter(gider => {
          if (!gider) return false;

          const ad = gider.ad || '';
          const baslik = gider.baslik || '';
          const altBaslik = gider.altBaslik || '';
          const odemeTarihiStr = gider.odemeTarihi || '';
          const sonOdemeTarihiStr = gider.sonOdemeTarihi || '';
          const tutarStr = typeof gider.tutar === 'number' ? Number(gider.tutar).toLocaleString() : '';

          const searchMatch = ad.toLowerCase().includes(lowerCaseSearchQuery) ||
                              baslik.toLowerCase().includes(lowerCaseSearchQuery) ||
                              altBaslik.toLowerCase().includes(lowerCaseSearchQuery) ||
                              (odemeTarihiStr && formatTarih(odemeTarihiStr).toLowerCase().includes(lowerCaseSearchQuery)) ||
                              (sonOdemeTarihiStr && formatTarih(sonOdemeTarihiStr).toLowerCase().includes(lowerCaseSearchQuery)) ||
                              tutarStr.toLowerCase().includes(lowerCaseSearchQuery);

          if (!searchMatch) return false;

          if (tab === 'tum' && appliedFilterStatus) {
             const isOdendi = gider.odendi === true || gider.durum === 'gerceklesen';
             console.log(`Filtering status: ${appliedFilterStatus} for gider ${gider.id}`, {durum: gider.durum, odendi: gider.odendi, isOdendi: isOdendi});
             if (appliedFilterStatus === 'odendi' && !isOdendi) return false;
             if (appliedFilterStatus === 'odenmesiGereken' && isOdendi) return false;
          }

          if (appliedFilterBaslik && (gider.baslik || '') !== appliedFilterBaslik) return false;
          if (appliedFilterAltBaslik && (gider.altBaslik || '') !== appliedFilterAltBaslik) return false;

          if (appliedFilterAy) {
              const targetMonth = parseInt(appliedFilterAy, 10) - 1;
              let dateToCheck: Date | undefined;

              if (tab === 'kesinlesen') {
                   if (gider.odemeTarihi) {
                      const d = new Date(gider.odemeTarihi);
                       if (!isNaN(d.getTime())) dateToCheck = d;
                   }
              } else {
                   const odemeTrh = gider.odendi ? gider.odemeTarihi : gider.sonOdemeTarihi;
                   if (odemeTrh) {
                      const d = new Date(odemeTrh);
                       if (!isNaN(d.getTime())) dateToCheck = d;
                   }
              }

              if (!dateToCheck || dateToCheck.getMonth() !== targetMonth) return false;
          }

         return true;
       });

       const sorted = filtered.sort((a, b) => {
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;

         if (tab === 'tum') {
           const latestA = getLatestDate(a.createdAt, a.sonOdemeTarihi);
           const latestB = getLatestDate(b.createdAt, b.sonOdemeTarihi);
           return compareDates(latestB, latestA, 'desc');

         } else if (tab === 'gerceklesen') {
           return compareDates(b.sonOdemeTarihi, a.sonOdemeTarihi, 'desc');
         } else if (tab === 'kesinlesen') {
           return compareDates(a.sonOdemeTarihi, b.sonOdemeTarihi, 'asc');
         }
         return 0;
       });

       console.log("useMemo finished, returning sorted array of length:", sorted.length);
       return sorted;

     } catch (error) {
       console.error("Error during filtering or sorting in useMemo:", error);
       return [];
     }

   }, [tab, tumGiderler, searchQuery, appliedFilterStatus, appliedFilterBaslik, appliedFilterAltBaslik, appliedFilterAy]);

  const totalItems = filteredAndSortedGiderler.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedGiderler = useMemo(() => {
      setCurrentPage(1);
      return filteredAndSortedGiderler.slice(startIndex, endIndex);
  }, [filteredAndSortedGiderler, startIndex, endIndex]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const totalAmount = useMemo(() => {
      return paginatedGiderler.reduce((sum, gider) => {
         return sum + (typeof gider?.tutar === 'number' ? gider.tutar : 0);
      }, 0);
   }, [paginatedGiderler]);

  const selectedBaslik = basliklar.find(b => b.isim === filterBaslikInput);
  const altBaslikOptions = selectedBaslik?.altBasliklar || [];

  const ayOptions = [
    { value: '1', label: 'Ocak' }, { value: '2', label: 'Şubat' }, { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' }, { value: '5', label: 'Mayıs' }, { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' }, { value: '8', label: 'Ağustos' }, { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' }, { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' },
  ];

  const applyFilters = () => {
    setAppliedFilterStatus(filterStatusInput);
    setAppliedFilterBaslik(filterBaslikInput);
    setAppliedFilterAltBaslik(filterAltBaslikInput);
    setAppliedFilterAy(filterAyInput);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterStatusInput('');
    setFilterBaslikInput('');
    setFilterAltBaslikInput('');
    setFilterAyInput('');
    setAppliedFilterStatus('');
    setAppliedFilterBaslik('');
    setAppliedFilterAltBaslik('');
    setAppliedFilterAy('');
    setCurrentPage(1);
  };

  useEffect(() => {
       setCurrentPage(1);
   }, [tab, appliedFilterStatus, appliedFilterBaslik, appliedFilterAltBaslik, appliedFilterAy, searchQuery]);

  return (
    <div className="w-full"
      style={{ background: 'transparent' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-8">
          <button className={`pb-2 ${tab==='tum' ? 'border-b-2 border-green-500 text-green-600 font-semibold' : 'text-gray-500'}`} onClick={()=>{setTab('tum'); setIsFilterOpen(false); setSearchQuery(''); clearFilters();}}>Tümü</button>
          <button className={`pb-2 ${tab==='gerceklesen' ? 'border-b-2 border-green-500 text-green-600 font-semibold' : 'text-gray-500'}`} onClick={()=>{setTab('gerceklesen'); setIsFilterOpen(false); setSearchQuery(''); clearFilters();}}>Gerçekleşen Giderler</button>
          <button className={`pb-2 ${tab==='kesinlesen' ? 'border-b-2 border-green-500 text-green-600 font-semibold' : 'text-gray-500'}`} onClick={()=>{setTab('kesinlesen'); setIsFilterOpen(false); setSearchQuery(''); clearFilters();}}>Kesinleşen Giderler</button>
        </div>
        <div className="flex items-center gap-2">
           {isSearchOpen && (
              <input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3 py-1 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-40"
              />
           )}
           <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 rounded-full hover:bg-gray-200">
              <FaSearch className="text-gray-600" />
           </button>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-2 rounded-full hover:bg-gray-200">
              <FaFilter className="text-gray-600" />
           </button>
        </div>
      </div>

       {isFilterOpen && (
         <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4 flex flex-wrap gap-4 items-center">
            {tab === 'tum' && (
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Durum</label>
                 <select
                   value={filterStatusInput}
                   onChange={e => setFilterStatusInput(e.target.value)}
                   className="w-36 px-3 py-1 border rounded-lg text-gray-700"
                 >
                   <option value="">Tümü</option>
                   <option value="odendi">Ödendi</option>
                   <option value="odenmesiGereken">Ödenmesi Gereken</option>
                 </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gider Başlığı</label>
              <select
                value={filterBaslikInput}
                onChange={e => {setFilterBaslikInput(e.target.value); setFilterAltBaslikInput('')}}
                className="w-40 px-3 py-1 border rounded-lg text-gray-700"
                disabled={loadingBasliklar}
              >
                <option value="">Tümü</option>
                 {!loadingBasliklar && basliklar.map(baslik => (
                   <option key={baslik.id} value={baslik.isim}>{baslik.isim}</option>
                 ))}
              </select>
            </div>

             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gider Alt Başlığı</label>
              <select
                value={filterAltBaslikInput}
                onChange={e => setFilterAltBaslikInput(e.target.value)}
                className="w-40 px-3 py-1 border rounded-lg text-gray-700"
                disabled={!filterBaslikInput || loadingBasliklar}
              >
                <option value="">Tümü</option>
                 {!loadingBasliklar && altBaslikOptions.map(altBaslik => (
                   <option key={altBaslik.id} value={altBaslik.isim}>{altBaslik.isim}</option>
                 ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ay</label>
              <select
                 value={filterAyInput}
                 onChange={e => setFilterAyInput(e.target.value)}
                 className="w-32 px-3 py-1 border rounded-lg text-gray-700"
              >
                <option value="">Tümü</option>
                {ayOptions.map(ay => (
                   <option key={ay.value} value={ay.value}>{ay.label}</option>
                ))}
              </select>
            </div>

             <button
              onClick={applyFilters}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Filtrele
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors text-sm font-semibold"
            >
              Filtreleri Temizle
            </button>

         </div>
       )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
      {tab === 'tum' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Gider Adı</TableHeaderCell>
              <TableHeaderCell>Gider Başlığı</TableHeaderCell>
              <TableHeaderCell>Gider Alt Başlığı</TableHeaderCell>
              <TableHeaderCell>Ödenmesi Gereken Tarih</TableHeaderCell>
              <TableHeaderCell align="right">Tutar</TableHeaderCell>
              <TableHeaderCell>Ödeme Tarihi</TableHeaderCell>
              <TableHeaderCell>Durum</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(paginatedGiderler) && paginatedGiderler.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-gray-400" style={{textAlign: 'center'}}>
                  <span style={{display: 'block', gridColumn: '1 / -1'}}>Filtreleme/arama sonucuna uygun kayıt bulunamadı.</span>
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(paginatedGiderler) ? paginatedGiderler.map(gider => (
                <TableRow key={gider.id}>
                  <TableCell>{gider.ad || '-'}</TableCell>
                  <TableCell>{gider.baslik || '-'}</TableCell>
                  <TableCell>{gider.altBaslik || '-'}</TableCell>
                  <TableCell>{formatTarih(gider.sonOdemeTarihi)}</TableCell>
                  <TableCell align="right">{typeof gider.tutar === 'number' ? Number(gider.tutar).toLocaleString() : '-'} TL</TableCell>
                  <TableCell>
                    {gider.odemeTarihi ? formatTarih(gider.odemeTarihi) : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={gider.odendi === true ? 'odendi' : 'odenmesiGereken'}>
                      {gider.odendi === true ? 'Ödendi' : 'Ödenmesi Gereken'}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell className="text-center py-8 text-red-500" style={{textAlign: 'center'}}>
                    <span style={{display: 'block', gridColumn: '1 / -1'}}>Veri yüklenirken beklenmedik bir hata oluştu.</span>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}
      {tab === 'gerceklesen' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Gider Adı</TableHeaderCell>
              <TableHeaderCell>Gider Başlığı</TableHeaderCell>
              <TableHeaderCell>Gider Alt Başlığı</TableHeaderCell>
              <TableHeaderCell>Ödenmesi Gereken Tarih</TableHeaderCell>
              <TableHeaderCell align="right">Tutar</TableHeaderCell>
              <TableHeaderCell>Ödeme Tarihi</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(paginatedGiderler) && paginatedGiderler.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-gray-400" style={{textAlign: 'center'}}>
                  <span style={{display: 'block', gridColumn: '1 / -1'}}>Filtreleme/arama sonucuna uygun gerçekleşen gider yok.</span>
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(paginatedGiderler) ? paginatedGiderler.map(gider => (
                <TableRow key={gider.id}>
                  <TableCell>{gider.ad || '-'}</TableCell>
                  <TableCell>{gider.baslik || '-'}</TableCell>
                  <TableCell>{gider.altBaslik || '-'}</TableCell>
                  <TableCell>{formatTarih(gider.sonOdemeTarihi)}</TableCell>
                  <TableCell align="right">{typeof gider.tutar === 'number' ? Number(gider.tutar).toLocaleString() : '-'} TL</TableCell>
                  <TableCell>
                    {gider.odemeTarihi ? formatTarih(gider.odemeTarihi) : '-'}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell className="text-center py-8 text-red-500" style={{textAlign: 'center'}}>
                    <span style={{display: 'block', gridColumn: '1 / -1'}}>Veri yüklenirken beklenmedik bir hata oluştu.</span>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}
      {tab === 'kesinlesen' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Gider Adı</TableHeaderCell>
              <TableHeaderCell>Gider Başlığı</TableHeaderCell>
              <TableHeaderCell>Gider Alt Başlığı</TableHeaderCell>
              <TableHeaderCell>Gider Türü</TableHeaderCell>
              <TableHeaderCell>Kalan Ay</TableHeaderCell>
              <TableHeaderCell>Ödenmesi Gereken Tarih</TableHeaderCell>
              <TableHeaderCell align="right">Tutar</TableHeaderCell>
              <TableHeaderCell align="center">İşlem</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(paginatedGiderler) && paginatedGiderler.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-gray-400">
                  Filtreleme/arama sonucuna uygun kesinleşen gider yok.
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(paginatedGiderler) ? paginatedGiderler.map(gider => (
                <TableRow key={gider.id}>
                  <TableCell>{gider.ad || '-'}</TableCell>
                  <TableCell>{gider.baslik || '-'}</TableCell>
                  <TableCell>{gider.altBaslik || '-'}</TableCell>
                  <TableCell>{gider.tur || '-'}</TableCell>
                  <TableCell>{typeof gider.kalanAy === 'number' ? gider.kalanAy : '-'}</TableCell>
                  <TableCell>{formatTarih(gider.sonOdemeTarihi)}</TableCell>
                  <TableCell align="right">{typeof gider.tutar === 'number' ? Number(gider.tutar).toLocaleString() : '-'} TL</TableCell>
                  <TableCell align="center">
                    {gider.odendi === false && gider.durum === 'kesinlesen' && (
                      <ActionButton onClick={() => handleOde(gider)}>
                        Ödendi
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell className="text-center py-8 text-red-500">
                    Veri yüklenirken beklenmedik bir hata oluştu.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}

           {Array.isArray(paginatedGiderler) && paginatedGiderler.length > 0 && (
               <div className="mt-4 text-right font-bold text-lg text-gray-800">
                   Toplam Tutar: {Number(totalAmount).toLocaleString('tr-TR')} TL
               </div>
           )}

           <div className="flex justify-center items-center mt-4 space-x-2">
             <span
               onClick={handlePreviousPage}
               className={`font-semibold text-gray-700 cursor-pointer ${currentPage === 1 || !Array.isArray(filteredAndSortedGiderler) || filteredAndSortedGiderler.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-600'}`}
               style={{ pointerEvents: (currentPage === 1 || !Array.isArray(filteredAndSortedGiderler) || filteredAndSortedGiderler.length === 0) ? 'none' : 'auto' }}
             >
               &lt;
             </span>

             <span className="font-semibold text-gray-700 mx-2">
               {totalPages > 0 ? currentPage : 0}
             </span>

             <span
               onClick={handleNextPage}
               disabled={currentPage === totalPages || totalPages === 0 || !Array.isArray(filteredAndSortedGiderler) || filteredAndSortedGiderler.length === 0}
               className={`font-semibold text-gray-700 cursor-pointer ${currentPage === totalPages || totalPages === 0 || !Array.isArray(filteredAndSortedGiderler) || filteredAndSortedGiderler.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-600'}`}
               style={{ pointerEvents: (currentPage === totalPages || totalPages === 0 || !Array.isArray(filteredAndSortedGiderler) || filteredAndSortedGiderler.length === 0) ? 'none' : 'auto' }}
             >
               &gt;
             </span>
           </div>

        </>
      )}

      {/* Gider Ödeme Modal */}
      <GiderOdemeModal
        isOpen={isGiderOdemeModalOpen}
        onClose={() => setIsGiderOdemeModalOpen(false)}
        gider={selectedGider}
      />
    </div>
  );
} 