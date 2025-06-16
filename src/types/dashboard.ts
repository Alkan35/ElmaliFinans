import { Timestamp } from 'firebase/firestore';

export interface Gelir {
  id: string;
  ad?: string;
  baslik: string;
  tur: 'tekSeferlik' | 'taksitli' | 'aylikHizmet';
  tutar: number;
  toplamTutar?: number;
  paraBirimi: string;
  durum: 'bekleniyor' | 'kesinlesen' | 'tahsilEdildi';
  createdAt: Timestamp;
  odemeBeklenenTarih?: string;
  odemeTarihi?: string;
  kalanAy?: number;
  toplamTaksitSayisi?: number;
  taksitSirasi?: number;
  altBaslik?: string;
  sonOdemeTarihi?: string;
}

export interface Gider {
  id: string;
  ad?: string;
  baslik: string;
  altBaslik: string;
  tarih?: string;
  tutar: number;
  durum: 'bekleniyor' | 'ödendi' | 'kesinlesen' | 'gerceklesen';
  tur?: string;
  createdAt?: Timestamp;
  odemeTarihi?: string;
  odemeBeklenenTarih?: string;
  sonOdemeTarihi?: string;
  odendi?: boolean;
}

export interface DashboardStats {
  totalGerceklesenGelir: number;
  totalGerceklesenGider: number;
  guncelBakiye: number;
  totalKesinlesenGelir: number;
  totalKesinlesenGider: number;
  beklenenDurum: number;
} 