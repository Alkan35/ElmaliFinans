import { Gelir, Gider, DashboardStats } from '@/types/dashboard';

// Tarih parse fonksiyonu
export function parseDate(dateString: string | undefined | null): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;

  // DD/MM/YYYY formatını dene
  const partsDDMMYYYY = dateString.split('/');
  if (partsDDMMYYYY.length === 3) {
    const day = parseInt(partsDDMMYYYY[0]);
    const month = parseInt(partsDDMMYYYY[1]);
    const year = parseInt(partsDDMMYYYY[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month > 0 && month <= 12) {
      const date = new Date(year, month - 1, day);
      if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
        return date;
      }
    }
  }

  // YYYY-MM-DD formatını dene
  const partsYYYYMMDD = dateString.split('-');
  if (partsYYYYMMDD.length === 3) {
    const year = parseInt(partsYYYYMMDD[0]);
    const month = parseInt(partsYYYYMMDD[1]);
    const day = parseInt(partsYYYYMMDD[2]);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month > 0 && month <= 12) {
      const date = new Date(year, month - 1, day);
      if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
        return date;
      }
    }
  }

  console.warn("Bilinmeyen tarih formatı veya geçersiz tarih stringi:", dateString);
  return null;
}

// Dashboard istatistiklerini hesapla
export function calculateDashboardStats(gelirler: Gelir[], giderler: Gider[]): DashboardStats {
  // Gerçekleşen Gelir: durum === 'tahsilEdildi'
  const gerceklesenGelirler = gelirler.filter(gelir => gelir.durum === 'tahsilEdildi');
  const totalGerceklesenGelir = gerceklesenGelirler.reduce((sum, gelir) => sum + (gelir.tutar || 0), 0);

  // Gerçekleşen Gider: durum === 'ödendi' veya 'gerceklesen'
  const gerceklesenGiderler = giderler.filter(gider => gider.durum === 'ödendi' || gider.durum === 'gerceklesen');
  const totalGerceklesenGider = gerceklesenGiderler.reduce((sum, gider) => sum + (gider.tutar || 0), 0);

  // Güncel Bakiye
  const guncelBakiye = totalGerceklesenGelir - totalGerceklesenGider;

  // Kesinleşen Gelir: durum === 'kesinlesen'
  const kesinlesenGelirler = gelirler.filter(gelir => gelir.durum === 'kesinlesen');
  const totalKesinlesenGelir = kesinlesenGelirler.reduce((sum, gelir) => sum + (gelir.tutar || gelir.toplamTutar || 0), 0);

  // Kesinleşen Gider: durum === 'kesinlesen'
  const kesinlesenGiderler = giderler.filter(gider => gider.durum === 'kesinlesen');
  const totalKesinlesenGider = kesinlesenGiderler.reduce((sum, gider) => sum + (gider.tutar || 0), 0);

  // Beklenen Durum
  const beklenenDurum = totalKesinlesenGelir - totalKesinlesenGider;

  return {
    totalGerceklesenGelir,
    totalGerceklesenGider,
    guncelBakiye,
    totalKesinlesenGelir,
    totalKesinlesenGider,
    beklenenDurum,
  };
} 