import { useState, useEffect } from 'react';
import Modal from './Modal';

// Ay seçenekleri (GelirlerTable.tsx'ten kopyalandı veya utils'e taşınabilir)
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

// Durum seçenekleri (GelirlerTable.tsx'ten kopyalandı veya utils'e taşınabilir)
const durumSecenekleri = [
    { value: 'tahsilEdildi', label: 'Ödeme Alındı' },
    { value: 'bekleniyor', label: 'Bekleniyor' },
    // 'kesinlesen' durumu genellikle filtrede seçilmez, bekleyen olarak listelenir
];

// Ödeme Türü seçenekleri (GelirlerTable.tsx'ten kopyalandı veya utils'e taşınabilir)
const turSecenekleri = [
    { value: 'tekSeferlik', label: 'Tek Ödeme' },
    { value: 'taksitli', label: 'Taksitli Ödeme' },
    { value: 'aylikHizmet', label: 'Aylık Hizmet' },
];


interface GelirFiltreModalProps {
  isOpen: boolean;
  activeTab: 'tumu' | 'gerceklesen' | 'kesinlesen';
  filters: {
      expectedMonth: number | null;
      paidMonth: number | null;
      status: string | null;
      type: string | null;
  };
  setFilters: (filters: GelirFiltreModalProps['filters']) => void;
  onClose: () => void;
}

export default function GelirFiltreModal({ isOpen, activeTab, filters, setFilters, onClose }: GelirFiltreModalProps) {
    // Modal içinde kendi geçici filtre state'ini tut
    const [modalFilters, setModalFilters] = useState(filters);

    // filters dışarıdan değiştiğinde modal içindeki state'i güncelle
    useEffect(() => {
        setModalFilters(filters);
    }, [filters]);


    const handleFilterChange = (filterName: keyof GelirFiltreModalProps['filters'], value: string | number) => {
        setModalFilters(prev => ({
            ...prev,
            [filterName]: value === '' ? null : value, // Seçilmediyse null yap
        }));
    };

    const applyFilters = () => {
        setFilters(modalFilters); // Ana componente filtreleri uygula
        onClose(); // Modalı kapat
    };

    const handleClearFilters = () => {
         setModalFilters({ // Modal içindeki state'i temizle
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
        onClose(); // Modalı kapat
    };


  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrele"
    >
      <div className="space-y-4">
        {/* Tümü sekmesi filtreleri */}
        {activeTab === 'tumu' && (
            <>
                 <div>
                     <label className="block text-sm font-medium text-gray-700">Ödeme Beklenen Ay</label>
                     <select
                         value={modalFilters.expectedMonth === null ? '' : modalFilters.expectedMonth}
                         onChange={(e) => handleFilterChange('expectedMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700">Ödeme Ayı</label>
                     <select
                         value={modalFilters.paidMonth === null ? '' : modalFilters.paidMonth}
                         onChange={(e) => handleFilterChange('paidMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700">Durum</label>
                     <select
                         value={modalFilters.status === null ? '' : modalFilters.status}
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
                 <div>
                     <label className="block text-sm font-medium text-gray-700">Ödeme Beklenen Ay</label>
                     <select
                         value={modalFilters.expectedMonth === null ? '' : modalFilters.expectedMonth}
                         onChange={(e) => handleFilterChange('expectedMonth', Number(e.target.value))}
                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                         <option value="">Tümü</option>
                         {aySecenekleri.map(ay => (
                             <option key={ay.value} value={ay.value}>{ay.label}</option>
                         ))}
                     </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700">Ödeme Ayı</label>
                     <select
                         value={modalFilters.paidMonth === null ? '' : modalFilters.paidMonth}
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
                 <div>
                      <label className="block text-sm font-medium text-gray-700">Ödeme Türü</label>
                      <select
                          value={modalFilters.type === null ? '' : modalFilters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                          <option value="">Tümü</option>
                          {turSecenekleri.map(tur => (
                              <option key={tur.value} value={tur.value}>{tur.label}</option>
                          ))}
                      </select>
                 </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700">Ödeme Beklenen Ay</label>
                      <select
                          value={modalFilters.expectedMonth === null ? '' : modalFilters.expectedMonth}
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
        <div className="flex justify-end space-x-3 mt-6">
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
                 Uygula
             </button>
        </div>
      </div>
    </Modal>
  );
} 