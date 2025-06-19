import { useState } from 'react';
import { updateDoc, doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Gelir } from '@/types/dashboard';
import toast from 'react-hot-toast';
import { useCompany } from '@/contexts/CompanyContext';

interface OdemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gelir: Gelir | null;
}

export default function OdemeModal({ isOpen, onClose, gelir }: OdemeModalProps) {
  const { currentCompany } = useCompany();
  const [odemeSecimi, setOdemeSecimi] = useState<'hepsi' | 'diger'>('hepsi');
  const [kismiTutar, setKismiTutar] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !gelir) return null;

  const handleOdemeAl = async () => {
    if (!gelir.id) {
      toast.error("Gelir ID'si bulunamadı.");
      return;
    }

    if (!currentCompany) {
      toast.error("Şirket bilgisi bulunamadı.");
      return;
    }

    setLoading(true);

    try {
      const collectionName = `gelirler-${currentCompany.id}`;
      const gelirDocRef = doc(db, collectionName, gelir.id);
      
      if (odemeSecimi === 'hepsi') {
        // Mevcut mantık - tüm tutar gerçekleşen gelirlere geçer
        await updateDoc(gelirDocRef, {
          durum: 'tahsilEdildi',
          odemeTarihi: new Date().toISOString().split('T')[0],
        });
        
        toast.success(`${gelir.ad} için tam ödeme alındı.`);
      } else {
        // Kısmi ödeme mantığı
        const kismiMiktar = parseFloat(kismiTutar.replace(/\./g, ''));
        const mevcutTutar = typeof gelir.tutar === 'number' ? gelir.tutar : 0;
        
        if (isNaN(kismiMiktar) || kismiMiktar <= 0) {
          toast.error('Lütfen geçerli bir tutar girin.');
          setLoading(false);
          return;
        }
        
        if (kismiMiktar >= mevcutTutar) {
          toast.error('Kısmi tutar mevcut tutardan küçük olmalıdır.');
          setLoading(false);
          return;
        }
        
        // Gerçekleşen gelir olarak yeni kayıt oluştur
        // Undefined değerleri filtrele
        const cleanGelirData = Object.fromEntries(
          Object.entries(gelir).filter(([key, value]) => value !== undefined && key !== 'id')
        );
        
        await addDoc(collection(db, collectionName), {
          ...cleanGelirData,
          tutar: kismiMiktar,
          durum: 'tahsilEdildi',
          odemeTarihi: new Date().toISOString().split('T')[0],
          createdAt: Timestamp.now(),
          parentId: gelir.id, // Ana kaydın referansı
        });
        
        // Mevcut kaydın tutarını güncelle (kalan kısmı kesinleşen olarak kalır)
        const kalanTutar = mevcutTutar - kismiMiktar;
        await updateDoc(gelirDocRef, {
          tutar: kalanTutar,
        });
        
        toast.success(`${kismiMiktar.toLocaleString('tr-TR')} TL kısmi ödeme alındı. Kalan: ${kalanTutar.toLocaleString('tr-TR')} TL`);
      }
      
      onClose();
      setKismiTutar('');
      setOdemeSecimi('hepsi');
    } catch (error) {
      console.error("Ödeme işlenirken hata:", error);
      toast.error("Ödeme işlenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTutarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatMoney(e.target.value);
    const numericValue = parseFloat(formattedValue.replace(/\./g, ''));
    const maxTutar = typeof gelir?.tutar === 'number' ? gelir.tutar : 0;
    
    // Eğer girilen değer toplam tutardan büyükse, maksimum tutarı set et
    if (!isNaN(numericValue) && numericValue >= maxTutar) {
      const maxFormatted = (maxTutar - 1).toLocaleString('tr-TR'); // 1 TL eksik yaparak tam tutara eşit olmasını engelle
      setKismiTutar(maxFormatted);
      toast.error(`Kısmi tutar ${maxTutar.toLocaleString('tr-TR')} TL'den küçük olmalıdır.`);
    } else {
      setKismiTutar(formattedValue);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Ödeme Al</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-semibold text-gray-900">
              {gelir.ad}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Toplam Tutar:</span>
            <span className="font-bold text-lg text-green-600">
              {typeof gelir.tutar === 'number' ? gelir.tutar.toLocaleString('tr-TR') : '0'} TL
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödeme Türü
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="odemeSecimi"
                  value="hepsi"
                  checked={odemeSecimi === 'hepsi'}
                  onChange={(e) => setOdemeSecimi(e.target.value as 'hepsi' | 'diger')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Hepsi</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="odemeSecimi"
                  value="diger"
                  checked={odemeSecimi === 'diger'}
                  onChange={(e) => setOdemeSecimi(e.target.value as 'hepsi' | 'diger')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Kısmi Ödeme</span>
              </label>
            </div>
          </div>

          {odemeSecimi === 'diger' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Tutarı (TL)
              </label>
              <input
                type="text"
                value={kismiTutar}
                onChange={handleTutarChange}
                placeholder={`Maksimum: ${typeof gelir?.tutar === 'number' ? (gelir.tutar - 1).toLocaleString('tr-TR') : '0'} TL`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
          >
            İptal
          </button>
          <button
            onClick={handleOdemeAl}
            disabled={loading || (odemeSecimi === 'diger' && !kismiTutar)}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>İşleniyor...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Ödeme Al</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 