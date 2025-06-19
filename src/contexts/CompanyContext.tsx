'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Company {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}

export interface UserCompanyData {
  companies: string[];
  defaultCompany?: string;
}

interface CompanyContextType {
  currentCompany: Company | null;
  userCompanies: Company[];
  loading: boolean;
  error: string | null;
  
  // Methods
  setCurrentCompany: (company: Company) => void;
  createCompany: (name: string, user: User) => Promise<Company>;
  getUserCompanies: (user: User) => Promise<void>;
  addUserToCompany: (userId: string, companyId: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LocalStorage'dan şirket bilgisini yükle
  useEffect(() => {
    const savedCompanyId = localStorage.getItem('currentCompanyId');
    const savedCompany = localStorage.getItem('currentCompany');
    
    if (savedCompanyId && savedCompany) {
      try {
        setCurrentCompanyState(JSON.parse(savedCompany));
      } catch (err) {
        console.error('Kaydedilen şirket bilgisi yüklenemedi:', err);
        localStorage.removeItem('currentCompanyId');
        localStorage.removeItem('currentCompany');
      }
    }
  }, []);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
    localStorage.setItem('currentCompanyId', company.id);
    localStorage.setItem('currentCompany', JSON.stringify(company));
  };

  const createCompany = async (name: string, user: User): Promise<Company> => {
    setLoading(true);
    setError(null);
    
    try {
      // Şirket ID'si oluştur (kebab-case)
      const companyId = name.toLowerCase()
        .replace(/[ğ]/g, 'g')
        .replace(/[ü]/g, 'u')
        .replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i')
        .replace(/[ö]/g, 'o')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const company: Company = {
        id: companyId,
        name,
        createdBy: user.uid,
        createdAt: new Date()
      };

      // Şirketi oluştur
      await setDoc(doc(db, 'companies', companyId), company);

      // User'ın şirket listesine ekle
      await addUserToCompany(user.uid, companyId);

      // Local state'i güncelle
      setUserCompanies(prev => [...prev, company]);
      
      return company;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError('Şirket oluşturulurken hata: ' + errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserCompanies = async (user: User): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // User'ın company bilgilerini al
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userCompanyData: UserCompanyData = { companies: [] };
      
      if (userDoc.exists()) {
        userCompanyData = userDoc.data() as UserCompanyData;
      } else {
        // İlk giriş - default şirket oluştur
        const defaultCompany = await createDefaultCompany(user);
        userCompanyData = {
          companies: [defaultCompany.id],
          defaultCompany: defaultCompany.id
        };
        
        await setDoc(userDocRef, {
          email: user.email,
          ...userCompanyData,
          createdAt: new Date()
        });
        
        setUserCompanies([defaultCompany]);
        setCurrentCompany(defaultCompany);
        return;
      }

      // User'ın şirketlerini getir
      if (userCompanyData.companies && userCompanyData.companies.length > 0) {
        const companiesQuery = query(
          collection(db, 'companies'),
          where('__name__', 'in', userCompanyData.companies.slice(0, 10)) // Firestore limit
        );
        
        const companiesSnapshot = await getDocs(companiesQuery);
        const companies: Company[] = [];
        
        companiesSnapshot.forEach(doc => {
          companies.push({ id: doc.id, ...doc.data() } as Company);
        });
        
        setUserCompanies(companies);
        
        // Default şirketi ayarla
        if (!currentCompany && companies.length > 0) {
          const defaultComp = companies.find(c => c.id === userCompanyData.defaultCompany) || companies[0];
          setCurrentCompany(defaultComp);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError('Şirket bilgileri yüklenirken hata: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addUserToCompany = async (userId: string, companyId: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserCompanyData;
      const companies = userData.companies || [];
      
      if (!companies.includes(companyId)) {
        companies.push(companyId);
        await setDoc(userDocRef, { ...userData, companies }, { merge: true });
      }
    }
  };

  const createDefaultCompany = async (user: User): Promise<Company> => {
    const defaultCompany: Company = {
      id: 'elmali-tech',
      name: 'Elmalı Tech',
      createdBy: user.uid,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'companies', 'elmali-tech'), defaultCompany);
    return defaultCompany;
  };

  const value: CompanyContextType = {
    currentCompany,
    userCompanies,
    loading,
    error,
    setCurrentCompany,
    createCompany,
    getUserCompanies,
    addUserToCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
} 