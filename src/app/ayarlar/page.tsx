'use client';
import { useState } from 'react';
import GiderBasliklari from '@/components/GiderBasliklari';
import Calisanlar from '@/components/Calisanlar';
import KayitDuzenlePaneli from '@/components/KayitDuzenlePaneli';

export default function AyarlarPage() {
  const [aktifSekme, setAktifSekme] = useState<'gider' | 'calisan' | 'duzenle'>('gider');

  return (
    <div className="min-h-screen h-screen w-full bg-gray-100 flex">
      {/* Sol Menü */}
      <aside className="w-64 bg-white text-gray-800 flex flex-col py-8 px-0 border-r border-gray-200 relative h-full">
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left px-8 py-3 rounded-l-full font-semibold text-lg transition-all ${aktifSekme === 'gider' ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-800'}`}
                onClick={() => setAktifSekme('gider')}
              >
                Gider Başlıkları
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-8 py-3 rounded-l-full font-semibold text-lg transition-all ${aktifSekme === 'calisan' ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-800'}`}
                onClick={() => setAktifSekme('calisan')}
              >
                Çalışanlar
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-8 py-3 rounded-l-full font-semibold text-lg transition-all ${aktifSekme === 'duzenle' ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-800'}`}
                onClick={() => setAktifSekme('duzenle')}
              >
                Kayıtları Düzenle
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      {/* Sağ Panel */}
      <main className="flex-1 flex flex-col items-start justify-start py-12 px-12 h-full bg-gray-100">
        {aktifSekme === 'gider' && <GiderBasliklari />}
        {aktifSekme === 'calisan' && <Calisanlar />}
        {aktifSekme === 'duzenle' && <KayitDuzenlePaneli />}
      </main>
    </div>
  );
} 