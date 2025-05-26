import { useState, useEffect } from 'react';

// Ay seçenekleri (Bir utils dosyasına taşınması idealdir)
const aySecenekleri = [
    { value: 0, label: 'Ocak' },
    { value: 1, label: 'Şubat' },
    { value: 2, label: 'Mart' },
    { value: 3, label: 'Nisan' },
    { value: 4, label: 'Mayıs' },
    { value: 5, label: 'Haziran' },
    { value: 6, label: 'Temmuz' },
    { value: 7, label: 'Ağustos' },
    { value: 8, label: 'Eylül' },
    { value: 9, label: 'Ekim' },
    { value: 10, label: 'Kasım' },
    { value: 11, label: 'Aralık' },
];

// Durum seçenekleri (Bir utils dosyasına taşınması idealdir)
const durumSecenekleri = [
    { value: 'tahsilEdildi', label: 'Ödeme Alındı' },
    { value: 'bekleniyor', label: 'Bekleniyor' },
    // 'kesinlesen' durumu genellikle filtrede seçilmez, bekleyen olarak listelenir
];

// Ödeme Türü seçenekleri (Bir utils dosyasına taşınması idealdir)
const turSecenekleri = [
    { value: 'tekSeferlik', label: 'Tek Ödeme' },
    { value: 'taksitli', label: 'Taksitli Ödeme' },
    { value: 'aylikHizmet', label: 'Aylık Hizmet' },
];


interface GelirFiltrePanelProps {
  activeTab: 'tumu' | 'gerceklesen' | 'kesinlesen';
  currentFilters: {
      expectedMonth: number | null;
      paidMonth: number | null;
      status: string | null;
      type: string | null;
  };
  setFilters: (filters: GelirFiltrePanelProps['currentFilters']) => void;
  // onClose prop'u panele taşınmadı
}

export default function GelirFiltrePanel({ activeTab, currentFilters, setFilters }: GelirFiltrePanelProps) {
    // Panel içinde kendi geçici filtre state'ini tut
    const [panelFilters, setPanelFilters] = useState(currentFilters);

    // currentFilters dışarıdan değiştiğinde panel içindeki state'i güncelle
    useEffect(() => {
        setPanelFilters(currentFilters);
    }, [currentFilters]);


    const handleFilterChange = (filterName: keyof GelirFiltrePanelProps['currentFilters'], value: any) => {
        setPanelFilters(prev => ({
            ...prev,
            [filterName]: value === '' ? null : value, // Seçilmediyse null yap
        }));
    };

    const applyFilters = () => {
        setFilters(panelFilters); // Ana componente filtreleri uygula
        // Panel kapanmayacak, sadece filtreler uygulanacak
    };

    const handleClearFilters = () => {
         setPanelFilters({ // Panel içindeki state'i temizle
             expectedMonth: null,
             paidMonth: null,
             status: null,
             type: null,
         });
         setFilters({ // Ana componente filtreleri temizleme komutu gönder
             expectedMonth: null,
             paidMonth: null,
             status: null,
             type: null,
         });
         // Panel kapanmayacak, sadece filtreler temizlenecek
    };


  return (
    <div className="flex flex-wrap items-end space-x-4 space-y-2"> {/* Flexbox ile yatay hizalama */}
        {/* Tümü sekmesi filtreleri */}
        {activeTab === 'tumu' && (
            <>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                     <label className="block text-sm font-medium text-gray-700">Ödeme Beklenen Ay</label>
                     <select
                         value={panelFilters.expectedMonth === null ? '' : panelFilters.expectedMonth}
                         onChange={(e) => handleFilterChange('expectedMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                     <label className="block text-sm font-medium text-gray-700">Ödeme Ayı</label>
                     <select
                         value={panelFilters.paidMonth === null ? '' : panelFilters.paidMonth}
                         onChange={(e) => handleFilterChange('paidMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                     <label className="block text-sm font-medium text-gray-700">Durum</label>
                     <select
                         value={panelFilters.status === null ? '' : panelFilters.status}
                         onChange={(e) => handleFilterChange('status', e.target.value)}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {durumSecenekleri.map(durum => (
                             <option key={durum.value} value={durum.value}>{durum.label}</option>
                         ))}
                     </select>
                 </div>
            </>
        )}

        {/* Gerçekleşen Gelirler sekmesi filtreleri */}
         {activeTab === 'gerceklesen' && (
             <>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                     <label className="block text-sm font-medium text-gray-700">Ödeme Beklenen Ay</label>
                     <select
                         value={panelFilters.expectedMonth === null ? '' : panelFilters.expectedMonth}
                         onChange={(e) => handleFilterChange('expectedMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                     <label className="block text-sm font-medium text-gray-700">Ödeme Ayı</label>
                     <select
                         value={panelFilters.paidMonth === null ? '' : panelFilters.paidMonth}
                         onChange={(e) => handleFilterChange('paidMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
             </>
         )}

        {/* Kesinleşen Gelirler sekmesi filtreleri */}
         {activeTab === 'kesinlesen' && (
             <>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                      <label className="block text-sm font-medium text-gray-700">Ödeme Türü</label>
                      <select
                          value={panelFilters.type === null ? '' : panelFilters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                          <option value="">Tümü</option>
                          {turSecenekleri.map(tur => (
                              <option key={tur.value} value={tur.value}>{tur.label}</option>
                          ))}
                      </select>
                 </div>
                 <div className="flex-1 min-w-[150px]"> {/* Responsive genişlik */}
                      <label className="block text-sm font-medium text-gray-700">Ödeme Beklenen Ay</label>
                      <select
                          value={panelFilters.expectedMonth === null ? '' : panelFilters.expectedMonth}
                          onChange={(e) => handleFilterChange('expectedMonth', Number(e.target.value))}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                          <option value="">Tümü</option>
                          {aySecenekleri.map(ay => (
                              <option key={ay.value} value={ay.value}>{ay.label}</option>
                          ))}
                      </select>
                 </div>
             </>
         )}


        {/* Butonlar */}
        <div className="flex items-end space-x-3"> {/* Butonlar için flex container */}
            <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Filtreleri Temizle
            </button>
             <button
                 type="button"
                 onClick={applyFilters}
                 className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
             >
                 Filtrele
             </button>
        </div>
    </div>
  );
} 