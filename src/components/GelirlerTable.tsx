import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Firebase konfigürasyonunuzun yolu
import { Gelir } from '@/types/dashboard'; // Gelir arayüzünüzün yolu
import { formatTarih } from '@/utils/dateUtils';
import GelirFiltrePanel from '@/components/GelirFiltrePanel';
import OdemeModal from '@/components/OdemeModal';
// Search icon için bir import ekleyelim, projenizde kullandığınız icon kütüphanesine göre değişebilir
// Örneğin React Icons kullanıyorsanız:
// import { FaSearch } from 'react-icons/fa';

// Para formatlama ve birim ile gösterme fonksiyonu
function displayMoney(value: number | string): string {
    if (typeof value === 'string') {
         value = Number(value.replace(/\./g, ''));
    }
    if (isNaN(value)) return `0 TL`;
    return `${value.toLocaleString('tr-TR')} TL`;
}



export default function GelirlerTable() {
  const [activeTab, setActiveTab] = useState<'tumu' | 'gerceklesen' | 'kesinlesen'>('tumu');
  const [gelirler, setGelirler] = useState<Gelir[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Arama ve filtreleme state'leri buraya eklenebilir

  // Arama state'leri
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtre state'leri (Filtre panelinin görünürlüğü için state eklendi)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({ // Filtre değerleri için state
      expectedMonth: null as number | null,
      paidMonth: null as number | null,
      status: null as string | null,
      type: null as string | null,
  });

  // Ödeme modal state'leri
  const [isOdemeModalOpen, setIsOdemeModalOpen] = useState(false);
  const [selectedGelir, setSelectedGelir] = useState<Gelir | null>(null);

    // Filtreleri temizleme fonksiyonu
    const clearFilters = () => {
        setFilters({
            expectedMonth: null,
            paidMonth: null,
            status: null,
            type: null,
        });
    };

    // activeTab değiştiğinde filtreleri temizle
    useEffect(() => {
        clearFilters();
         setIsSearchOpen(false); // Sekme değiştiğinde arama çubuğunu kapat
         setIsFilterPanelOpen(false); // Sekme değiştiğinde filtre panelini kapat
    }, [activeTab]);

  // Firebase'den gelirleri çekme (real-time listener ile)
  useEffect(() => {
      setLoading(true);
      setError(null); // Her yeni sorguda hatayı temizle

      let gelirQuery: Query;

      // Aktif sekmeye göre sıralama belirle
      if (activeTab === 'tumu') {
          // En son işlem yapılan veri en üstte (createdAt azalan)
          gelirQuery = query(collection(db, 'gelirler'), orderBy('createdAt', 'desc'));
      } else if (activeTab === 'gerceklesen') {
          // Ödeme Tarihi günümüze en yakın en üstte (odemeTarihi azalan)
           // Firebase'de string formatındaki tarihlerle azalan sıralama, taksitli/aylık hizmetlerdeki
           // YYYY-MM-DD formatı için doğru çalışacaktır.
          gelirQuery = query(collection(db, 'gelirler'), orderBy('odemeTarihi', 'desc'));
      } else { // activeTab === 'kesinlesen'
          // Ödeme Beklenen Tarih günümüze en yakın en üstte (odemeBeklenenTarih artan)
           // Geleceğe doğru sıralama için artan (asc) kullanılır.
           gelirQuery = query(collection(db, 'gelirler'), orderBy('odemeBeklenenTarih', 'asc'));
      }

      const unsubscribe = onSnapshot(gelirQuery, (snapshot) => {
          const gelirlerData = snapshot.docs.map(doc => ({
              ...doc.data(), // Belgenin kendi içeriği yayıldı
              id: doc.id // Gerçek Firestore belge ID'si atandı (boş id'yi ezecek)
          })) as Gelir[];

          console.log("GelirlerTable - onSnapshot: Fetched data count:", gelirlerData.length);
          console.log("GelirlerTable - onSnapshot: First 5 IDs:", gelirlerData.slice(0, 5).map(g => g.id)); // İlk 5 kaydın ID'sini logla

          setGelirler(gelirlerData);
          setLoading(false);
      }, (err) => {
          console.error("Error fetching or filtering gelirler:", err);
          setError("Gelirler yüklenirken veya filtrelenirken hata oluştu.");
      setLoading(false);
      });

      return () => unsubscribe(); // Cleanup function to unsubscribe from snapshot listener
      // activeTab state'i değiştiğinde useEffect yeniden çalışacak ve yeni sorguyu başlatacak
  }, [activeTab]); // activeTab'ı dependency olarak ekle

  // Tab filtrelemesi, Normal Filtreleme ve Arama filtrelemesi useMemo
  const filteredGelirler = useMemo(() => {
    if (!Array.isArray(gelirler)) return [];

    // 1. Sekme filtrelemesi
    let data = gelirler;
    switch (activeTab) {
        case 'gerceklesen':
            data = gelirler.filter(gelir => gelir.durum === 'tahsilEdildi');
            break;
        case 'kesinlesen':
            data = gelirler.filter(gelir => gelir.durum === 'kesinlesen');
            break;
         // 'tumu' için filtreleme yok, doğrudan gelirler kullanılır
    }

    // 2. Normal Filtreleme (filters state'ine göre)
    if (filters.expectedMonth !== null) {
         data = data.filter(gelir => {
             if (!gelir.odemeBeklenenTarih) return false;
             const date = new Date(gelir.odemeBeklenenTarih);
             return !isNaN(date.getTime()) && date.getMonth() === filters.expectedMonth;
         });
    }

     if (filters.paidMonth !== null) {
         data = data.filter(gelir => {
             if (!gelir.odemeTarihi) return false;
             const date = new Date(gelir.odemeTarihi);
             return !isNaN(date.getTime()) && date.getMonth() === filters.paidMonth;
         });
    }

     if (filters.status !== null) {
         data = data.filter(gelir => gelir.durum === filters.status);
    }

     if (filters.type !== null) {
         data = data.filter(gelir => gelir.tur === filters.type);
    }

    // Eğer arama sorgusu boş değilse 3. Arama filtrelemesi
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        data = data.filter(gelir => {
             // Arama yapılacak alanlar
             if (gelir.ad?.toLowerCase().includes(lowerCaseQuery)) return true;
             if (displayMoney(gelir.tutar).toLowerCase().includes(lowerCaseQuery)) return true;
             if (gelir.odemeBeklenenTarih && formatTarih(gelir.odemeBeklenenTarih).toLowerCase().includes(lowerCaseQuery)) return true;
             if (gelir.odemeTarihi && formatTarih(gelir.odemeTarihi).toLowerCase().includes(lowerCaseQuery)) return true;

             const odemeTuruText = gelir.tur === 'tekSeferlik' ? 'Tek Ödeme' : gelir.tur === 'taksitli' ? 'Taksitli Ödeme' : gelir.tur === 'aylikHizmet' ? 'Aylık Hizmet' : '';
             if (odemeTuruText.toLowerCase().includes(lowerCaseQuery)) return true;

             const durumText = gelir.durum === 'tahsilEdildi' ? 'Ödeme Alındı' : gelir.durum === 'bekleniyor' ? 'Bekleniyor' : gelir.durum === 'kesinlesen' ? 'Kesinleşen' : '';
             if (durumText.toLowerCase().includes(lowerCaseQuery)) return true;

             if (typeof gelir.kalanAy === 'number' && String(gelir.kalanAy).includes(searchQuery)) return true;
             if (typeof gelir.kalanAy !== 'number' && gelir.kalanAy === '-' && lowerCaseQuery.includes('-')) return true;

             return false;
        });
    }

    return data; // Filtrelenmiş ve sıralanmış veri
}, [gelirler, activeTab, searchQuery, filters]); // filters dependency'sini ekle

  // "Ödeme Alındı" butonuna basıldığında çalışacak fonksiyon
  const handleOdemeAlindi = (gelir: Gelir) => {
    setSelectedGelir(gelir);
    setIsOdemeModalOpen(true);
  };


  // Taksitli gelirler için kalan ay hesaplama veya gösterme mantığı
  // Kesinleşen tablosunda her taksit ayrı satır olacağı için,
  // o satırın kalanAy değerini göstermemiz yeterli olacaktır.
  // Yeni Gelir Formu'nda kalanAy'ı nasıl kaydettiğinize bağlı olarak burası ayarlanır.
  // Eğer formda 3, 2, 1 şeklinde kaydedildiyse, o değeri direkt gösteririz.
  const renderKalanAy = (gelir: Gelir) => {
      if (gelir.tur === 'taksitli' || gelir.tur === 'aylikHizmet') {
           return typeof gelir.kalanAy === 'number' && gelir.kalanAy > 0 ? gelir.kalanAy : '-';
      }
       return '-';
  };


  // Tablo başlıklarını render etmek için yardımcı fonksiyon
  const renderTableHeaders = () => {
    if (activeTab === 'tumu') {
      return (
        <tr className="text-xs text-gray-700 uppercase bg-gray-100">
          <th className="px-4 py-2 font-bold text-left">Gelir Adı</th>
          <th className="px-4 py-2 font-bold text-left">Ödeme Beklenen Tarih</th>
          <th className="px-4 py-2 font-bold text-right">Tutar</th>
          <th className="px-4 py-2 font-left">Ödeme Tarihi</th>
          <th className="px-4 py-2 font-left">Durum</th>
        </tr>
      );
    } else if (activeTab === 'gerceklesen') {
       return (
         <tr className="text-xs text-gray-700 uppercase bg-gray-100">
           <th className="px-4 py-2 font-bold text-left">Gelir Adı</th>
           <th className="px-4 py-2 font-bold text-left">Ödeme Beklenen Tarih</th>
           <th className="px-4 py-2 font-bold text-right">Tutar</th>
           <th className="px-4 py-2 font-left">Ödeme Tarihi</th>
         </tr>
       );
    } else if (activeTab === 'kesinlesen') {
        return (
          <tr className="text-xs text-gray-700 uppercase bg-gray-100">
            <th className="px-4 py-2 font-bold text-left">Gelir Adı</th>
            <th className="px-4 py-2 font-bold text-left">Ödeme Türü</th>
            <th className="px-4 py-2 font-left">Kalan Ay</th>
            <th className="px-4 py-2 font-left">Ödeme Beklenen Tarih</th>
            <th className="px-4 py-2 font-bold text-right">Tutar</th>
            <th className="px-4 py-2 font-center">İşlem</th>
          </tr>
        );
    }
    return null; // Varsayılan olarak null döner, bu durumda thead boş olur
  };


  // Tablo içeriğini render etmek için yardımcı fonksiyon
  const renderTableBody = (gelirler: Gelir[]) => {
      if (loading) {
          const colSpan = activeTab === 'tumu' ? 5 : activeTab === 'gerceklesen' ? 4 : 6;
          return <tr><td colSpan={colSpan} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr>;
      }

      // Filtreler uygulanmış veya arama yapılmış ve sonuç yoksa
      if ((searchQuery || Object.values(filters).some(filter => filter !== null)) && gelirler.length === 0) {
          const colSpan = activeTab === 'tumu' ? 5 : activeTab === 'gerceklesen' ? 4 : 6;
          return <tr><td colSpan={colSpan} className="text-center py-8 text-gray-400">Seçili filtreler ve arama kriterleri ile eşleşen kayıt bulunamadı.</td></tr>;
      }

      // Genel olarak hiç veri yoksa
      if (!Array.isArray(gelirler) || gelirler.length === 0) {
          const colSpan = activeTab === 'tumu' ? 5 : activeTab === 'gerceklesen' ? 4 : 6;
          return <tr><td colSpan={colSpan} className="text-center py-8 text-gray-400">Kayıt bulunamadı.</td></tr>;
      }

      return gelirler.map((gelir, index) => (
          <tr key={gelir.id || index} className="text-sm text-gray-800 border-b hover:bg-gray-50 transition">
              {/* Tüm tablar için ortak alanlar */}
              <td className="px-4 py-2 text-left font-semibold">{gelir.ad || '-'}</td>

              {activeTab === 'tumu' && (
                <>
                   {/* Tümü tabına özel alanlar */}
                    <td className="px-4 py-2 text-left">{gelir.odemeBeklenenTarih ? formatTarih(gelir.odemeBeklenenTarih) : '-'}</td>
                    <td className="px-4 py-2 text-right">{displayMoney(gelir.tutar)}</td>
                    <td className="px-4 py-2 text-left">{gelir.odemeTarihi ? formatTarih(gelir.odemeTarihi) : '-'}</td>
                    <td className="px-4 py-2 text-left">
                        {gelir.durum === 'tahsilEdildi' ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Ödeme Alındı</span>
                        ) : (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">Bekleniyor</span>
                        )}
                    </td>
                </>
              )}

              {activeTab === 'gerceklesen' && (
                  <>
                       {/* Gerçekleşen Gelirler tabına özel alanlar */}
                       <td className="px-4 py-2 text-left">{gelir.odemeBeklenenTarih ? formatTarih(gelir.odemeBeklenenTarih) : '-'}</td>
                       <td className="px-4 py-2 text-right">{displayMoney(gelir.tutar)}</td>
                       <td className="px-4 py-2 text-left">{gelir.odemeTarihi ? formatTarih(gelir.odemeTarihi) : '-'}</td>
                  </>
              )}

              {activeTab === 'kesinlesen' && (
                   <>
                       {/* Kesinleşen Gelirler tabına özel alanlar */}
                       <td className="px-4 py-2 text-left">
                           {gelir.tur === 'tekSeferlik' ? 'Tek Ödeme' : gelir.tur === 'taksitli' ? 'Taksitli Ödeme' : gelir.tur === 'aylikHizmet' ? 'Aylık Hizmet' : '-'}
                        </td>
                       <td className="px-4 py-2 text-left">{renderKalanAy(gelir)}</td>
                       <td className="px-4 py-2 text-left">{gelir.odemeBeklenenTarih ? formatTarih(gelir.odemeBeklenenTarih) : '-'}</td>
                       <td className="px-4 py-2 text-right">{displayMoney(gelir.tutar)}</td>
                       <td className="px-4 py-2 text-center">
                            {gelir.durum === 'kesinlesen' && (
                                <button
                                    onClick={() => handleOdemeAlindi(gelir)}
                                    className="bg-green-500 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                    Ödeme Alındı
                                </button>
                            )}
                            {gelir.durum === 'tahsilEdildi' && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Tahsil Edildi</span>
                            )}
                       </td>
                   </>
              )}
          </tr>
      ));
  };

  // Sayfalama için yeni state'ler
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;

  // Sayfalama için hesaplamalar
  const totalItems = filteredGelirler.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Sayfalanmış veri
  const paginatedGelirler = useMemo(() => {
    setCurrentPage(1); // Filtreler değiştiğinde ilk sayfaya dön
    return filteredGelirler.slice(startIndex, endIndex);
  }, [filteredGelirler, startIndex, endIndex]);

  // Sayfa değiştirme fonksiyonları
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

  // Toplam tutar hesaplama
  const totalAmount = useMemo(() => {
    return paginatedGelirler.reduce((sum, gelir) => {
      return sum + (typeof gelir?.tutar === 'number' ? gelir.tutar : 0);
    }, 0);
  }, [paginatedGelirler]);

  // Filtreler veya sekme değiştiğinde ilk sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filters]);

  return (
      <div className="bg-white p-4 rounded-md shadow overflow-x-auto">
          {/* Tablar ve Arama/Filtre alanı için üst container */}
          <div className="mb-4 border-b border-gray-200 pb-3 flex justify-between items-center">
              {/* Tab butonları */}
              <nav className="flex space-x-8" aria-label="Tabs">
                  {['tumu', 'gerceklesen', 'kesinlesen'].map((tab) => (
          <button 
                          key={tab}
            className={`${
                              activeTab === tab
                                  ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                          onClick={() => {
                              setActiveTab(tab as 'tumu' | 'gerceklesen' | 'kesinlesen');
                              setSearchQuery('');
                              setIsSearchOpen(false);
                              clearFilters();
                           }}
                      >
                          {tab === 'tumu' && 'Tümü'}
                          {tab === 'gerceklesen' && 'Gerçekleşen Gelirler'}
                          {tab === 'kesinlesen' && 'Kesinleşen Gelirler'}
          </button>
                  ))}
              </nav>

               {/* Arama inputu ve butonları */}
               <div className="flex items-center space-x-2">
                   {/* Arama çubuğu - isSearchOpen true ise göster */}
                    {isSearchOpen && (
                        <input
                           type="text"
                           placeholder="Ara..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 font-semibold px-3 py-2"
                           style={{ minWidth: '150px' }} // Minimum genişlik ayarı
                        />
                    )}
                   {/* Arama ikonu butonu */}
          <button 
                       onClick={() => { setIsSearchOpen(!isSearchOpen); setIsFilterPanelOpen(false); }} // Arama iconuna basınca filtre panelini kapat
                       className={`flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${!isSearchOpen && 'rounded-r-md'}`} // isSearchOpen kapalıysa sağ köşeyi yuvarla
                       aria-label="Arama"
                   >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>

                   {/* Filtre butonu */}
          <button 
                       onClick={() => { setIsFilterPanelOpen(!isFilterPanelOpen); setIsSearchOpen(false); }} // Filtre iconuna basınca arama çubuğunu kapat
                       className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                       aria-label="Filtrele"
                   >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7.172V4z"></path></svg>
          </button>
               </div>
      </div>

           {/* Filtre Panel Component'i - isFilterPanelOpen true ise göster */}
            {isFilterPanelOpen && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md shadow-inner">
                    <GelirFiltrePanel
                        activeTab={activeTab}
                        currentFilters={filters}
                        setFilters={setFilters}
                         // Panel içinde kapatma butonu olmayacak, state yönetimi üst componentte
                         // onClose kaldırıldı
                    />
                </div>
            )}

           {error && <div className="text-red-500 text-center py-4">{error}</div>}

        <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                  {renderTableHeaders()}
          </thead>
              <tbody className="divide-y divide-gray-200">
                  {renderTableBody(paginatedGelirler)}
              </tbody>
          </table>

           {/* Toplam tutar gösterimi */}
           {Array.isArray(paginatedGelirler) && paginatedGelirler.length > 0 && (
               <div className="mt-4 text-right font-bold text-lg text-gray-800">
                   Toplam Tutar: {Number(totalAmount).toLocaleString('tr-TR')} TL
                          </div>
           )}

           {/* Sayfalama kontrolleri */}
           <div className="flex justify-center items-center mt-4 space-x-2">
               <span
                   onClick={handlePreviousPage}
                   className={`font-semibold text-gray-700 cursor-pointer ${
                       currentPage === 1 || !Array.isArray(filteredGelirler) || filteredGelirler.length === 0 
                           ? 'opacity-50 cursor-not-allowed' 
                           : 'hover:text-blue-600'
                   }`}
                   style={{ 
                       pointerEvents: (currentPage === 1 || !Array.isArray(filteredGelirler) || filteredGelirler.length === 0) 
                           ? 'none' 
                           : 'auto' 
                   }}
               >
                   &lt;
                            </span>

               <span className="font-semibold text-gray-700 mx-2">
                   {totalPages > 0 ? currentPage : 0}
                            </span>

               <span
                   onClick={handleNextPage}
                   className={`font-semibold text-gray-700 cursor-pointer ${
                       currentPage === totalPages || totalPages === 0 || !Array.isArray(filteredGelirler) || filteredGelirler.length === 0 
                           ? 'opacity-50 cursor-not-allowed' 
                           : 'hover:text-blue-600'
                   }`}
                   style={{ 
                       pointerEvents: (currentPage === totalPages || totalPages === 0 || !Array.isArray(filteredGelirler) || filteredGelirler.length === 0) 
                           ? 'none' 
                           : 'auto' 
                   }}
               >
                   &gt;
                            </span>
                          </div>

           {/* Ödeme Modal */}
           <OdemeModal
               isOpen={isOdemeModalOpen}
               onClose={() => setIsOdemeModalOpen(false)}
               gelir={selectedGelir}
           />

      </div>
  );
} 