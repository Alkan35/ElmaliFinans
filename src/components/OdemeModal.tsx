import { useState } from 'react';
import { updateDoc, doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Gelir } from '@/types/dashboard';
import toast from 'react-hot-toast';

interface OdemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gelir: Gelir | null;
}

export default function OdemeModal({ isOpen, onClose, gelir }: OdemeModalProps) {
  const [odemeSecimi, setOdemeSecimi] = useState<'hepsi' | 'diger'>('hepsi');
  const [kismiTutar, setKismiTutar] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !gelir) return null;

  const handleOdemeAl = async () => {
    if (!gelir.id) {
      toast.error("Gelir ID'si bulunamadı.");
      return;
    }

    setLoading(true);

    try {
      const gelirDocRef = doc(db, 'gelirler', gelir.id);
      
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
        
        await addDoc(collection(db, 'gelirler'), {
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
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ödeme Al</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>{gelir.ad}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Toplam Tutar: <strong>{typeof gelir.tutar === 'number' ? gelir.tutar.toLocaleString('tr-TR') : '0'} TL</strong>
          </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleOdemeAl}
            disabled={loading || (odemeSecimi === 'diger' && !kismiTutar)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Ödeme Al'}
          </button>
        </div>
      </div>
    </div>
  );
} 