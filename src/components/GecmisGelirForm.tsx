import { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Gelir } from '@/lib/definitions'; // Gelir interface'ini import edin
import { addMonthsToDate, formatTarih } from '@/utils/dateUtils'; // Utility fonksiyonları import edin


interface GecmisGelirFormProps {
  onClose: () => void;
}

// Para formatlama fonksiyonları (aynı kalıyor)
function formatMoney(value: string) {
     const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
     if (!cleaned) return '';
     return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function displayMoney(value: number | string): string { // paraBirimi parametresi kaldırıldı
     if (typeof value === 'string') {
          value = Number(value.replace(/\./g, ''));
     }
     if (isNaN(value)) return `0 TL`; // Varsayılan olarak 'TL' göster
     return `${value.toLocaleString('tr-TR')} TL`; // Varsayılan olarak 'TL' göster
}


interface TaksitDetay {
    taksitSirasi: number;
    label: string;
    yuzde: number | ''; // String veya sayı olabilir
    tutar: number | ''; // String veya sayı olabilir
    odemeTarihi: string; // YYYY-MM-DD formatında
}


export default function GecmisGelirForm({ onClose }: GecmisGelirFormProps) {
  const [gelirAdi, setGelirAdi] = useState('');
  const [odemeTuru, setOdemeTuru] = useState<'tekSeferlik' | 'taksitli' | 'aylikHizmet' | ''>('');
  const [tutar, setTutar] = useState(''); // Toplam tutar (string formatlı)
  const [odemeTarihi, setOdemeTarihi] = useState(''); // Tek seferlik ödeme tarihi veya Aylık hizmet/Taksitli başlangıç tarihi

  // Taksitli ödeme state'leri
  const [toplamTaksitSayisi, setToplamTaksitSayisi] = useState<number | ''>('');
  const [taksitDetaylari, setTaksitDetaylari] = useState<TaksitDetay[]>([]);

  // Aylık hizmet state'leri
  const [aylikHizmetSuresi, setAylikHizmetSuresi] = useState<number | ''>('');
   const [aylikHizmetDetaylari, setAylikHizmetDetaylari] = useState<{
        beklenenTarih: string; // YYYY-MM-DD formatında
        taksitAdi: string; // Örneğin "1. Ay"
    }[]>([]);
    const aylikTutarNumber = Number(tutar.replace(/\./g, '')); // Aylık hizmet için tutar state'i 'tutar'

   // Toplam tutarı sayı olarak alalım
   const totalAmountNumber = Number(tutar.replace(/\./g, ''));


    // Taksit detaylarını güncelle useEffect
   useEffect(() => {
        if (odemeTuru !== 'taksitli' || typeof toplamTaksitSayisi !== 'number' || toplamTaksitSayisi <= 0) {
             setTaksitDetaylari([]);
             return;
        }

        const yeniDetaylar: TaksitDetay[] = Array.from({ length: toplamTaksitSayisi }, (_, index) => {
             const existingDetail = taksitDetaylari[index];

             let label = `${index + 1}. Taksit`;

             if (toplamTaksitSayisi === 1) {
                 label = 'Tek Ödeme';
             } else if (index === 0) {
                 label = 'Ön Ödeme';
             } else if (index === toplamTaksitSayisi - 1) {
                 label = 'Final Ödemesi';
             } else {
                  label = `${index}. Taksit`;
             }


             return {
                 taksitSirasi: index + 1,
                 label: label,
                 yuzde: existingDetail?.yuzde || '',
                 tutar: existingDetail?.tutar || '',
                 odemeTarihi: existingDetail?.odemeTarihi || '',
             };
        });

        if (totalAmountNumber > 0) {
             yeniDetaylar.forEach(detay => {
                 const currentTutar = Number(String(detay.tutar).replace(',', '.'));
                 const currentYuzde = Number(String(detay.yuzde).replace(',', '.'));

                 if (detay.tutar !== '') {
                      detay.yuzde = parseFloat(((currentTutar / totalAmountNumber) * 100).toFixed(2));
                 } else if (detay.yuzde !== '') {
                      detay.tutar = parseFloat(((currentYuzde / 100) * totalAmountNumber).toFixed(2));
                 } else {
                     detay.tutar = '';
                     detay.yuzde = '';
                 }
             });
        }

        setTaksitDetaylari(yeniDetaylar);

    }, [toplamTaksitSayisi, totalAmountNumber, odemeTuru]);


   // Aylık hizmet detaylarını güncelle useEffect
   useEffect(() => {
        if (odemeTuru !== 'aylikHizmet' || typeof aylikHizmetSuresi !== 'number' || aylikHizmetSuresi <= 0 || !odemeTarihi) {
          setAylikHizmetDetaylari([]);
          return;
        }

        const ilkTarihDate = new Date(odemeTarihi);
        if (isNaN(ilkTarihDate.getTime())) {
            setAylikHizmetDetaylari([]);
            return;
        }

        const yeniDetaylar = Array.from({ length: aylikHizmetSuresi }, (_, index) => {
            const beklenenTarihDate = addMonthsToDate(ilkTarihDate, index);
            const beklenenTarihString = `${beklenenTarihDate.getFullYear()}-${(beklenenTarihDate.getMonth() + 1).toString().padStart(2, '0')}-${beklenenTarihDate.getDate().toString().padStart(2, '0')}`;

            const taksitAdi = `${index + 1}. Ay`;

            return {
                beklenenTarih: beklenenTarihString,
                taksitAdi: taksitAdi
            };
        });

        setAylikHizmetDetaylari(yeniDetaylar);

    }, [aylikHizmetSuresi, odemeTarihi, odemeTuru]);


    // Taksit detayı değişim handler'ı
    const handleTaksitDetayChange = (index: number, field: keyof Omit<TaksitDetay, 'label' | 'taksitSirasi'>, value: any) => {
        const newTaksitDetaylari = [...taksitDetaylari];

        const numericValue = field === 'odemeTarihi' ? value : parseFloat(String(value).replace(',', '.'));

        if (field in newTaksitDetaylari[index]) {
            (newTaksitDetaylari[index] as any)[field] = numericValue;
        }

        if ((field === 'tutar' || field === 'yuzde') && totalAmountNumber > 0) {
             const currentDetay = newTaksitDetaylari[index];
             const currentTutar = Number(String(currentDetay.tutar).replace(',', '.'));
             const currentYuzde = Number(String(currentDetay.yuzde).replace(',', '.'));

             if (field === 'tutar' && currentDetay.tutar !== '') {
                  currentDetay.yuzde = parseFloat(((currentTutar / totalAmountNumber) * 100).toFixed(2));
             } else if (field === 'yuzde' && currentDetay.yuzde !== '') {
                   currentDetay.tutar = parseFloat(((currentYuzde / 100) * totalAmountNumber).toFixed(2));
             }
        }

        setTaksitDetaylari(newTaksitDetaylari);
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gelirAdi || !odemeTuru || !tutar) {
      alert("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    if (isNaN(totalAmountNumber) || totalAmountNumber <= 0) {
        alert("Geçerli bir tutar giriniz.");
        return;
    }

    let gelirDataList: Omit<Gelir, 'id'>[] = [];

    if (odemeTuru === 'tekSeferlik') {
         if (!odemeTarihi) {
              alert("Lütfen ödeme tarihini giriniz.");
              return;
         }
         const odemeDate = new Date(odemeTarihi);
         if (isNaN(odemeDate.getTime())) {
             alert("Geçersiz ödeme tarihi.");
             return;
         }

         gelirDataList.push({
             ad: gelirAdi,
             tur: 'tekSeferlik',
             durum: 'tahsilEdildi', // Otomatik tahsil edildi
             tutar: totalAmountNumber,
             paraBirimi: 'TL', // SABİT: TL
             odemeBeklenenTarih: odemeTarihi,
             odemeTarihi: odemeTarihi,
             createdAt: Timestamp.now(),
         });

    } else if (odemeTuru === 'taksitli') {
         if (typeof toplamTaksitSayisi !== 'number' || toplamTaksitSayisi <= 0) {
             alert("Lütfen toplam taksit sayısını giriniz.");
             return;
         }
          if (taksitDetaylari.length === 0 || taksitDetaylari.some(detay => detay.tutar === '' || detay.yuzde === '' || !detay.odemeTarihi || isNaN(new Date(detay.odemeTarihi).getTime()))) {
             alert("Lütfen tüm taksit detaylarını doğru şekilde doldurunuz.");
             return;
         }

         const totalCalculatedAmount = taksitDetaylari.reduce((sum, det) => sum + Number(det.tutar), 0);
         const totalCalculatedYuzde = taksitDetaylari.reduce((sum, det) => sum + Number(det.yuzde), 0);

         if (Math.abs(totalCalculatedAmount - totalAmountNumber) > 0.01 || Math.abs(totalCalculatedYuzde - 100) > 0.01) {
             console.warn("Taksit toplamları ana tutar veya %100 ile eşleşmiyor.", {
                 totalAmountNumber,
                 totalCalculatedAmount,
                 totalCalculatedYuzde
             });
         }


         taksitDetaylari.forEach((detay, index) => {
              const odemeDate = new Date(detay.odemeTarihi);
              if (isNaN(odemeDate.getTime())) {
                   console.warn("Geçersiz taksit ödeme tarihi atlandı:", detay.odemeTarihi);
                   return;
              }

              gelirDataList.push({
                 ad: `${gelirAdi} - ${detay.label}`,
                 tur: 'taksitli',
                 durum: 'tahsilEdildi',
                 tutar: Number(detay.tutar),
                 paraBirimi: 'TL', // SABİT: TL
                 odemeBeklenenTarih: detay.odemeTarihi,
                 odemeTarihi: detay.odemeTarihi,
                 createdAt: Timestamp.now(),
                 toplamTaksitSayisi: toplamTaksitSayisi,
                 taksitSirasi: detay.taksitSirasi,
                 kalanAy: toplamTaksitSayisi - detay.taksitSirasi,
             });
         });

    } else if (odemeTuru === 'aylikHizmet') {
         if (typeof aylikHizmetSuresi !== 'number' || aylikHizmetSuresi <= 0 || !odemeTarihi) {
              alert("Lütfen aylık hizmet süresini ve başlangıç tarihini giriniz.");
              return;
         }

         if (aylikHizmetDetaylari.length === 0) {
             alert("Aylık hizmet detayları oluşturulamadı. Lütfen süre ve başlangıç tarihini kontrol ediniz.");
             return;
         }

         aylikHizmetDetaylari.forEach((detay, index) => {
              const odemeDate = new Date(detay.beklenenTarih);
              if (isNaN(odemeDate.getTime())) {
                  console.warn("Geçersiz tarih detayı atlandı:", detay.beklenenTarih);
                  return;
              }

              gelirDataList.push({
                 ad: `${gelirAdi} - ${detay.taksitAdi}`,
                 tur: 'aylikHizmet',
                 durum: 'tahsilEdildi',
                 tutar: aylikTutarNumber,
                 paraBirimi: 'TL', // SABİT: TL
                 odemeBeklenenTarih: detay.beklenenTarih,
                 odemeTarihi: detay.beklenenTarih,
                 createdAt: Timestamp.now(),
                 toplamTaksitSayisi: aylikHizmetSuresi,
                 taksitSirasi: index + 1,
                 taksitAdi: detay.taksitAdi,
                 kalanAy: aylikHizmetSuresi - (index + 1),
              });
          });
    }


    if (gelirDataList.length === 0) {
         alert("Eklemek için gelir verisi oluşturulamadı. Lütfen formu kontrol ediniz.");
         return;
    }


    try {
        const batch = writeBatch(db);
        const gelirlerCollection = collection(db, 'gelirler');

        gelirDataList.forEach(data => {
             const docRef = doc(gelirlerCollection);
             batch.set(docRef, data);
        });


      await batch.commit();

      alert('Geçmiş Gelir(ler) başarıyla eklendi!');
      // Formu temizle ve kapat
      setGelirAdi('');
      setOdemeTuru('');
      setTutar('');
      setOdemeTarihi('');
      setToplamTaksitSayisi('');
      setTaksitDetaylari([]);
      setAylikHizmetSuresi('');
      setAylikHizmetDetaylari([]);


      onClose(); // Modalı kapat
    } catch (error) {
      console.error('Geçmiş gelir eklenirken hata oluştu:', error);
      alert('Geçmiş gelir eklenirken bir hata oluştu!');
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Gelir Adı</label>
        <input
          type="text"
          value={gelirAdi}
          onChange={(e) => setGelirAdi(e.target.value)}
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Ödeme Türü</label>
        <select
          value={odemeTuru}
          onChange={(e) => {
            setOdemeTuru(e.target.value as 'tekSeferlik' | 'taksitli' | 'aylikHizmet' | '');
            setTutar('');
            setOdemeTarihi('');
            setToplamTaksitSayisi('');
            setTaksitDetaylari([]);
            setAylikHizmetSuresi('');
            setAylikHizmetDetaylari([]);
          }}
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
        >
          <option value="">Seçiniz</option>
          <option value="tekSeferlik">Tek Ödeme</option>
          <option value="taksitli">Taksitli Ödeme</option>
          <option value="aylikHizmet">Aylık Hizmet</option>
        </select>
      </div>

      {(odemeTuru === 'tekSeferlik' || odemeTuru === 'taksitli' || odemeTuru === 'aylikHizmet') && (
          <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{odemeTuru === 'aylikHizmet' ? 'Aylık Tutar (TL)' : 'Toplam Tutar (TL)'}</label>
              <input
                   type="text"
                   inputMode="numeric"
                   value={tutar}
                   onChange={(e) => setTutar(formatMoney(e.target.value))}
                   required
                   className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
               />
           </div>
      )}


      {odemeTuru === 'tekSeferlik' && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Ödenen Tarih</label>
          <input
            type="date"
            value={odemeTarihi}
            onChange={(e) => setOdemeTarihi(e.target.value)}
            required
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
          />
        </div>
      )}

      {odemeTuru === 'taksitli' && (
          <>
               <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Toplam Taksit Sayısı</label>
                    <input
                        type="number"
                        min={1}
                        value={toplamTaksitSayisi}
                        onChange={(e) => setToplamTaksitSayisi(Math.max(1, Number(e.target.value)))}
                        required
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
                     />
                </div>

               {/* Dinamik Taksit Detayları Paneli */}
               {taksitDetaylari.length > 0 && totalAmountNumber > 0 && (
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border rounded-md p-4 bg-gray-50">
                   <h3 className="text-lg font-bold text-gray-800 mb-3">Taksit Detayları</h3>
                   {taksitDetaylari.map((detay, index) => (
                     <div key={index} className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 p-3 border-b last:border-b-0 bg-white rounded-md shadow-sm">
                       <div className="font-semibold text-gray-800 text-sm w-full md:w-auto">{detay.label}</div>
                       <div className="flex items-center space-x-2 w-full md:w-40">
                            <input
                                type="number"
                                placeholder="Yüzde (%)"
                                min="0"
                                max="100"
                                step="0.01"
                                value={detay.yuzde === '' ? '' : detay.yuzde}
                                onChange={(e) => {
                                    const yuzde = Number(e.target.value);
                                     if (!isNaN(yuzde)) {
                                         handleTaksitDetayChange(index, 'yuzde', yuzde);
                                     } else {
                                         handleTaksitDetayChange(index, 'yuzde', '');
                                     }
                                }}
                                className="w-1/2 border-gray-300 rounded-l-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold text-sm"
                            />
                            <span className="text-gray-600">%</span>
                             <input
                                type="number"
                                inputMode="numeric"
                                placeholder="Tutar"
                                min="0"
                                step="0.01"
                                value={detay.tutar === '' ? '' : detay.tutar}
                                onChange={(e) => {
                                     const formattedValue = formatMoney(e.target.value);
                                     const numValue = Number(formattedValue.replace(/\./g, ''));
                                     if (!isNaN(numValue)) {
                                         handleTaksitDetayChange(index, 'tutar', numValue);
                                     } else {
                                         handleTaksitDetayChange(index, 'tutar', '');
                                     }
                                }}
                                className="w-1/2 border-gray-300 rounded-r-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold text-sm"
                             />
                       </div>
                        <div className="flex items-center space-x-2 w-full md:flex-1">
                            <label className="block text-sm font-bold text-gray-700">Ödenen Tarih:</label>
                             <input
                                 type="date"
                                 value={detay.odemeTarihi}
                                 onChange={(e) => handleTaksitDetayChange(index, 'odemeTarihi', e.target.value)}
                                 required
                                 className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold text-sm"
                             />
                        </div>
                     </div>
                   ))}
                    {/* Toplam Tutar ve Yüzde Kontrolü (Gösterimde TL) */}
                     <div className="flex justify-end text-sm font-semibold text-gray-800 mt-2">
                          Toplam Tutar: {displayMoney(taksitDetaylari.reduce((sum, det) => sum + Number(det.tutar), 0))} ({taksitDetaylari.reduce((sum, det) => sum + Number(det.yuzde), 0).toFixed(2)}%)
                     </div>
                 </div>
               )}
           </>
       )}

       {odemeTuru === 'aylikHizmet' && (
          <>
               <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Aylık Hizmet Süresi (Ay)</label>
                   <input
                       type="number"
                       min={1}
                       max={60}
                       value={aylikHizmetSuresi}
                       onChange={(e) => setAylikHizmetSuresi(Math.max(1, Number(e.target.value)))}
                       required
                       className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
                   />
               </div>
               <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">İlk Ödenen Tarih (Başlangıç Tarihi)</label>
                   <input
                       type="date"
                       value={odemeTarihi}
                       onChange={(e) => setOdemeTarihi(e.target.value)}
                       required
                       className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
                   />
               </div>

               {/* Dinamik Aylık Hizmet Detayları Paneli (Gösterimde TL) */}
               {aylikHizmetDetaylari.length > 0 && aylikTutarNumber > 0 && (
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border rounded-md p-4 bg-gray-50">
                   <h3 className="text-lg font-bold text-gray-800">Aylık Ödeme Planı</h3>
                   {aylikHizmetDetaylari.map((detay, index) => (
                     <div key={index} className="flex items-center space-x-4 p-2 border-b last:border-b-0 bg-white rounded-md shadow-sm">
                       <div className="w-32 font-semibold text-gray-800 text-sm">{formatTarih(detay.beklenenTarih)}</div>
                       <div className="flex-1 text-sm text-gray-700">{detay.taksitAdi}</div>
                       <div className="w-32 text-right font-semibold text-sm text-gray-900">
                           {displayMoney(aylikTutarNumber)}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
           </>
       )}


      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors font-semibold text-lg"
      >
        Geçmiş Gelir Ekle
      </button>
    </form>
  );
} 