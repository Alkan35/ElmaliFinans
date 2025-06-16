'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Chart.js için gerekli bileşenleri kaydedin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Types
import { Gelir, Gider } from '@/types/dashboard';

// Utils
import { calculateDashboardStats } from '@/utils/dashboardUtils';

// Components
import DashboardStatsComponent from '@/components/dashboard/DashboardStats';
import GelirChart from '@/components/charts/GelirChart';
import GiderChart from '@/components/charts/GiderChart';
import GerceklesenChart from '@/components/charts/GerceklesenChart';
import KesinlesenChart from '@/components/charts/KesinlesenChart';
import AylikGiderAltBasliklarChart from '@/components/charts/AylikGiderAltBasliklarChart';
import GerceklesenKarZararChart from '@/components/charts/GerceklesenKarZararChart';
import KesinlesenKarZararChart from '@/components/charts/KesinlesenKarZararChart';


export default function Home() {
  const [gelirler, setGelirler] = useState<Gelir[]>([]);
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore'dan gerçek zamanlı veri çekme
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Gelirler listener
    const unsubscribeGelirler = onSnapshot(collection(db, 'gelirler'), (snapshot) => {
      const fetchedGelirler = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Gelir[];
      setGelirler(fetchedGelirler);
    }, (err) => {
      console.error("Gelirler çekilirken hata:", err);
      setError("Gelir verileri yüklenirken hata oluştu.");
      setLoading(false);
    });

    // Giderler listener
    const unsubscribeGiderler = onSnapshot(collection(db, 'giderler'), (snapshot) => {
      const fetchedGiderler = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Gider[];
      setGiderler(fetchedGiderler);
      setLoading(false);
    }, (err) => {
      console.error("Giderler çekilirken hata:", err);
      setError("Gider verileri yüklenirken hata oluştu.");
      setLoading(false);
    });

    // Cleanup function
    return () => {
      unsubscribeGelirler();
      unsubscribeGiderler();
    };
  }, []);

  // Dashboard istatistiklerini hesapla
  const stats = useMemo(() => {
    return calculateDashboardStats(gelirler, giderler);
  }, [gelirler, giderler]);

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">
                  Dashboard
                </h1>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Veriler yükleniyor...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Hata: {error}</div>
            ) : (
            <div className="p-4 lg:p-6">
              {/* Dashboard İstatistikleri */}
              <DashboardStatsComponent stats={stats} />

                {/* Grafik Alanı */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mt-6 lg:mt-8">
                {/* Gelir ve Gider Grafikleri */}
                <GelirChart gelirler={gelirler} />
                <GiderChart giderler={giderler} />

                {/* Gerçekleşen Grafikleri */}
                <GerceklesenChart gelirler={gelirler} giderler={giderler} />
                <GerceklesenKarZararChart gelirler={gelirler} giderler={giderler} />

                {/* Kesinleşen Grafikleri */}
                <KesinlesenChart gelirler={gelirler} giderler={giderler} />
                <KesinlesenKarZararChart gelirler={gelirler} giderler={giderler} />

                {/* Aylık Gider Alt Başlıkları Grafiği */}
                <AylikGiderAltBasliklarChart giderler={giderler} />

                 </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}