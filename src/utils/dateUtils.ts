import { Timestamp } from 'firebase/firestore'; // Firebase Timestamp import'unu ekleyin

// Tarihe ay ekleyen yardımcı fonksiyon, saat dilimi sorununu önlemek için öğlen 12:00'yi kullanır
export const addMonthsToDate = (date: Date, months: number): Date => {
    const d = new Date(date.getFullYear(), date.getMonth() + months, date.getDate(), 12, 0, 0); // Öğlen 12:00 olarak ayarla
    const originalDay = date.getDate();

    // Eğer setMonth işlemi sonucunda gün değiştiyse (örneğin 31 Mayıs -> 30 Haziran)
    // ve yeni gün orijinal günden küçükse (yani ay kısaysa), ayın son gününe ayarla.
    // Öğlen 12:00 kullandığımız için bu kontrol daha güvenli çalışır.
    if (d.getDate() !== originalDay) {
        // Yeni ayın ilk gününe git ve 1 gün geri gelerek ayın son gününü bul
        const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12, 0, 0);
        return lastDayOfMonth;
    }
    return d; // Öğlen 12:00 olarak ayarlanmış Date nesnesini döndür
}; 

// formatTarih fonksiyonunu buraya taşı ve export et
export function formatTarih(tarih: string | Date | Timestamp | { toDate?: () => Date } | undefined): string {
    if (!tarih) return '-';
    let d: Date;

    if (tarih instanceof Date) {
      d = tarih;
    } else if (tarih instanceof Timestamp) {
      d = tarih.toDate();
    } else if (typeof tarih === 'string') {
       const partsSlash = tarih.split('/');
       const partsDash = tarih.split('-');

       if (partsSlash.length === 3) {
           const gun = parseInt(partsSlash[0], 10);
           const ay = parseInt(partsSlash[1], 10) - 1;
           const yil = parseInt(partsSlash[2], 10);
           // GG/AA/YYYY formatını ayrıştırırken yerel saat diliminde Date objesi oluştur
           d = new Date(yil, ay, gun);
       } else if (partsDash.length === 3) {
            const yil = parseInt(partsDash[0], 10);
            const ay = parseInt(partsDash[1], 10) - 1;
            const gun = parseInt(partsDash[2], 10);
            // YYYY-MM-DD formatını ayrıştırırken yerel saat diliminde Date objesi oluştur
            d = new Date(yil, ay, gun);
       }
       else {
           // Bilinmeyen formatlar veya geçersiz stringler için fallback
           d = new Date(tarih);
       }

       if (isNaN(d.getTime())) {
           console.warn("formatTarih: Geçersiz tarih stringi veya formatı:", tarih);
           return '-';
       }
    }
     else {
      console.warn("formatTarih: Desteklenmeyen tarih tipi:", typeof tarih);
      return '-';
    }

    // Date objesini alıp GG/AA/YYYY formatında string olarak geri döndür
    const gun = d.getDate().toString().padStart(2, '0');
    const ay = (d.getMonth() + 1).toString().padStart(2, '0');
    const yil = d.getFullYear();
    return `${gun}/${ay}/${yil}`;
} 