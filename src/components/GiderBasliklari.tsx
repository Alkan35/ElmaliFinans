'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { FaTrash } from 'react-icons/fa';

interface AltBaslik {
  id: string;
  isim: string;
}

interface AnaBaslik {
  id: string;
  isim: string;
  altBasliklar: AltBaslik[];
}

export default function GiderBasliklari() {
  const [basliklar, setBasliklar] = useState<AnaBaslik[]>([]);
  const [yeniAnaBaslik, setYeniAnaBaslik] = useState('');
  const [yeniAltBaslik, setYeniAltBaslik] = useState<{ [key: string]: string }>({});
  const [acikAnaId, setAcikAnaId] = useState<string | null>(null);

  // Firestore'dan başlıkları çek
  useEffect(() => {
    const fetchBasliklar = async () => {
      const anaSnapshot = await getDocs(collection(db, 'giderBasliklari'));
      const anaList: AnaBaslik[] = anaSnapshot.docs.map(anaDoc => {
        const anaData = anaDoc.data();
        let altBasliklar: AltBaslik[] = [];
        if (Array.isArray(anaData.altBasliklar)) {
          altBasliklar = anaData.altBasliklar.map((alt: AltBaslik, i: number) => ({ id: alt.id || String(i), isim: alt.isim }));
        }
        return { id: anaDoc.id, isim: anaData.isim, altBasliklar };
      });
      setBasliklar(anaList);
    };
    fetchBasliklar();
  }, []);

  // Ana başlık ekle
  const anaBaslikEkle = async () => {
    if (!yeniAnaBaslik.trim()) return;
    const yeniAna = { isim: yeniAnaBaslik, altBasliklar: [] };
    const docRef = await addDoc(collection(db, 'giderBasliklari'), yeniAna);
    setBasliklar([...basliklar, { id: docRef.id, ...yeniAna }]);
    setYeniAnaBaslik('');
  };

  // Ana başlık sil
  const anaBaslikSil = async (anaId: string) => {
    if (!confirm('Bu ana başlığı ve alt başlıklarını silmek istediğinize emin misiniz?')) return;
    await deleteDoc(doc(db, 'giderBasliklari', anaId));
    setBasliklar(basliklar.filter(b => b.id !== anaId));
  };

  // Alt başlık ekle
  const altBaslikEkle = async (anaId: string) => {
    if (!yeniAltBaslik[anaId]?.trim()) return;
    const ana = basliklar.find(b => b.id === anaId);
    if (!ana) return;
    const yeniAlt: AltBaslik = { id: Date.now().toString(), isim: yeniAltBaslik[anaId] };
    const yeniAltlar = [...ana.altBasliklar, yeniAlt];
    await updateDoc(doc(db, 'giderBasliklari', anaId), { altBasliklar: yeniAltlar });
    setBasliklar(basliklar.map(b => b.id === anaId ? { ...b, altBasliklar: yeniAltlar } : b));
    setYeniAltBaslik({ ...yeniAltBaslik, [anaId]: '' });
  };

  // Alt başlık sil
  const altBaslikSil = async (anaId: string, altId: string) => {
    const ana = basliklar.find(b => b.id === anaId);
    if (!ana) return;
    const yeniAltlar = ana.altBasliklar.filter(alt => alt.id !== altId);
    await updateDoc(doc(db, 'giderBasliklari', anaId), { altBasliklar: yeniAltlar });
    setBasliklar(basliklar.map(b => b.id === anaId ? { ...b, altBasliklar: yeniAltlar } : b));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gider Başlıkları</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={yeniAnaBaslik}
            onChange={e => setYeniAnaBaslik(e.target.value)}
            placeholder="Yeni ana başlık"
            className="border border-gray-300 px-4 py-2 rounded-lg text-base focus:ring-2 focus:ring-green-500 outline-none shadow-sm placeholder:text-gray-500 text-gray-800"
          />
          <button onClick={anaBaslikEkle} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-base font-semibold shadow-sm transition">Ekle</button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl shadow divide-y divide-gray-200">
        {basliklar.map(ana => (
          <div key={ana.id}>
            <div className="w-full flex items-center justify-between px-6 py-4 text-lg font-medium text-gray-800 hover:bg-gray-100 transition rounded-xl">
              <button
                className="flex-1 text-left"
                onClick={() => setAcikAnaId(acikAnaId === ana.id ? null : ana.id)}
              >
                <span>{ana.isim}</span>
                <span className="text-sm text-gray-500 ml-2">{ana.altBasliklar.length} alt başlık</span>
              </button>
              <button onClick={() => anaBaslikSil(ana.id)} className="ml-4 text-gray-400 hover:text-red-600 p-1" title="Sil">
                <FaTrash size={16} />
              </button>
            </div>
            {acikAnaId === ana.id && (
              <div className="bg-white px-8 py-4 border-t border-gray-200">
                <div className="font-semibold text-gray-700 mb-2">Alt Başlıklar</div>
                <ul className="mb-4 space-y-1">
                  {ana.altBasliklar.map(alt => (
                    <li key={alt.id} className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-medium inline-flex items-center mr-2 mb-2 shadow-sm">
                      {alt.isim}
                      <button onClick={() => altBaslikSil(ana.id, alt.id)} className="ml-2 text-gray-400 hover:text-red-600 p-1" title="Sil">
                        <FaTrash size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={yeniAltBaslik[ana.id] || ''}
                    onChange={e => setYeniAltBaslik({ ...yeniAltBaslik, [ana.id]: e.target.value })}
                    placeholder="Alt başlık ekle"
                    className="border border-gray-300 px-3 py-2 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none shadow-sm placeholder:text-gray-500 text-gray-800"
                  />
                  <button onClick={e => { e.stopPropagation(); altBaslikEkle(ana.id); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-base font-semibold shadow-sm transition">Ekle</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 