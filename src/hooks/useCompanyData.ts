'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCompany } from '@/contexts/CompanyContext';
import { Gelir, Gider } from '@/types/dashboard';

// Gelirler için hook
export function useGelirler() {
  const [gelirler, setGelirler] = useState<Gelir[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (!currentCompany) {
      setGelirler([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Company-specific collection
    const collectionName = `gelirler-${currentCompany.id}`;
    const gelirlerQuery = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      gelirlerQuery,
      (snapshot) => {
        const fetchedGelirler = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Gelir[];
        console.log(`useGelirler - ${collectionName} veri sayısı:`, fetchedGelirler.length);
        setGelirler(fetchedGelirler);
        setLoading(false);
      },
      (err) => {
        console.error(`${collectionName} çekilirken hata:`, err);
        setError("Gelir verileri yüklenirken hata oluştu.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentCompany]);

  return { gelirler, loading, error };
}

// Giderler için hook
export function useGiderler() {
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (!currentCompany) {
      setGiderler([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Company-specific collection
    const collectionName = `giderler-${currentCompany.id}`;
    const giderlerQuery = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      giderlerQuery,
      (snapshot) => {
        const fetchedGiderler = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Gider[];
        console.log(`useGiderler - ${collectionName} veri sayısı:`, fetchedGiderler.length);
        setGiderler(fetchedGiderler);
        setLoading(false);
      },
      (err) => {
        console.error(`${collectionName} çekilirken hata:`, err);
        setError("Gider verileri yüklenirken hata oluştu.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentCompany]);

  return { giderler, loading, error };
}

// Birleşik veri hook'u (dashboard için)
export function useCompanyDashboardData() {
  const { gelirler, loading: gelirlerLoading, error: gelirlerError } = useGelirler();
  const { giderler, loading: giderlerLoading, error: giderlerError } = useGiderler();

  const loading = gelirlerLoading || giderlerLoading;
  const error = gelirlerError || giderlerError;

  return {
    gelirler,
    giderler,
    loading,
    error
  };
} 