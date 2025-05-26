import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaSearch, FaDownload } from 'react-icons/fa';

interface Sozlesme {
  id: string;
  baslik: string;
  ndaUrl: string | null;
  sozlesmeUrl: string | null;
  createdAt: any;
}

export default function SozlesmelerTable() {
  const [sozlesmeler, setSozlesmeler] = useState<Sozlesme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSozlesme, setSelectedSozlesme] = useState<Sozlesme | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'sozlesmeler'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sozlesmelerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sozlesme[];
      
      setSozlesmeler(sozlesmelerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSozlesmeler = sozlesmeler.filter(sozlesme =>
    sozlesme.baslik.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className="flex justify-end items-center mb-4">
        {isSearchOpen && (
          <input
            type="text"
            placeholder="Ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-40 mr-2"
          />
        )}
        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 rounded-full hover:bg-gray-200">
          <FaSearch className="text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-xs text-gray-700 uppercase bg-gray-100">
                <th className="px-4 py-2 font-bold text-left">Sözleşme Başlığı</th>
                <th className="px-4 py-2 font-bold text-left">NDA</th>
                <th className="px-4 py-2 font-bold text-left">Sözleşme</th>
                <th className="px-4 py-2 font-bold text-left">Eklenme Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSozlesmeler.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    Sözleşme bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSozlesmeler.map(sozlesme => (
                  <tr
                    key={sozlesme.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedSozlesme(sozlesme)}
                  >
                    <td className="px-4 py-2">{sozlesme.baslik}</td>
                    <td className="px-4 py-2">
                      {sozlesme.ndaUrl ? (
                        <span className="text-green-600">Mevcut</span>
                      ) : (
                        <span className="text-red-600">Mevcut değil</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {sozlesme.sozlesmeUrl ? (
                         <span className="text-green-600">Mevcut</span>
                      ) : (
                         <span className="text-red-600">Mevcut değil</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {sozlesme.createdAt?.toDate().toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedSozlesme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">{selectedSozlesme.baslik}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">NDA</h3>
                {selectedSozlesme.ndaUrl ? (
                  <button
                    onClick={() => handleDownload(selectedSozlesme.ndaUrl!, `${selectedSozlesme.baslik}-nda.pdf`)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaDownload className="inline mr-1" />
                    NDA'yı İndir
                  </button>
                ) : (
                  <p className="text-gray-600">NDA mevcut değil</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Sözleşme</h3>
                {selectedSozlesme.sozlesmeUrl ? (
                  <button
                    onClick={() => handleDownload(selectedSozlesme.sozlesmeUrl!, `${selectedSozlesme.baslik}-sozlesme.pdf`)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaDownload className="inline mr-1" />
                    Sözleşmeyi İndir
                  </button>
                ) : (
                  <p className="text-gray-600">Sözleşme mevcut değil</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedSozlesme(null)}
              className="mt-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 