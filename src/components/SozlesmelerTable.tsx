import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaSearch, FaDownload, FaTimes } from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';
import { useCompany } from '@/contexts/CompanyContext';

interface Sozlesme {
  id: string;
  baslik: string;
  ndaUrl: string | null;
  sozlesmeUrl: string | null;
  createdAt: Timestamp;
}

export default function SozlesmelerTable() {
  const { currentCompany } = useCompany();
  const [sozlesmeler, setSozlesmeler] = useState<Sozlesme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSozlesme, setSelectedSozlesme] = useState<Sozlesme | null>(null);

  useEffect(() => {
    if (!currentCompany) {
      setSozlesmeler([]);
      setLoading(false);
      return;
    }

    const collectionName = `sozlesmeler-${currentCompany.id}`;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sozlesmelerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sozlesme[];
      
      setSozlesmeler(sozlesmelerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentCompany]);

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
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">Sözleşme Listesi</h2>
          {sozlesmeler.length > 0 && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {filteredSozlesmeler.length} / {sozlesmeler.length} sözleşme
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {isSearchOpen && (
            <div className="relative">
              <input
                type="text"
                placeholder="Sözleşme ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                autoFocus
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            </div>
          )}
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
            className={`p-2 rounded-xl transition-all duration-200 ${
              isSearchOpen 
                ? 'bg-purple-100 text-purple-600 shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaSearch className="text-lg" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-lg">Yükleniyor...</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {filteredSozlesmeler.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Sözleşme bulunamadı</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Arama kriterlerinize uygun sözleşme bulunamadı.' : 'Henüz hiç sözleşme eklenmemiş.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Sözleşme Başlığı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      NDA Durumu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Sözleşme Durumu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Eklenme Tarihi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSozlesmeler.map((sozlesme, index) => (
                    <tr
                      key={sozlesme.id}
                      className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                      onClick={() => setSelectedSozlesme(sozlesme)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{sozlesme.baslik}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sozlesme.ndaUrl ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Mevcut
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Yok
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sozlesme.sozlesmeUrl ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Mevcut
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Yok
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sozlesme.createdAt?.toDate().toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSozlesme(sozlesme);
                          }}
                          className="text-purple-600 hover:text-purple-900 font-medium hover:bg-purple-50 px-3 py-1 rounded-lg transition-colors duration-200"
                        >
                          Görüntüle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Contract Details */}
      {selectedSozlesme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative transform transition-all">
            <button
              onClick={() => setSelectedSozlesme(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>

            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedSozlesme.baslik}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {selectedSozlesme.createdAt?.toDate().toLocaleDateString('tr-TR')} tarihinde eklendi
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">NDA Dosyası</h3>
                    {selectedSozlesme.ndaUrl ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Mevcut
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Yok
                      </span>
                    )}
                  </div>
                  {selectedSozlesme.ndaUrl ? (
                    <button
                      onClick={() => handleDownload(selectedSozlesme.ndaUrl!, `${selectedSozlesme.baslik}-nda.pdf`)}
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-medium hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors duration-200"
                    >
                      <FaDownload className="text-sm" />
                      <span>NDA&apos;yı İndir</span>
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm">NDA dosyası mevcut değil</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Sözleşme Dosyası</h3>
                    {selectedSozlesme.sozlesmeUrl ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Mevcut
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Yok
                      </span>
                    )}
                  </div>
                  {selectedSozlesme.sozlesmeUrl ? (
                    <button
                      onClick={() => handleDownload(selectedSozlesme.sozlesmeUrl!, `${selectedSozlesme.baslik}-sozlesme.pdf`)}
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-medium hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors duration-200"
                    >
                      <FaDownload className="text-sm" />
                      <span>Sözleşmeyi İndir</span>
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm">Sözleşme dosyası mevcut değil</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 