import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useCompany } from '@/contexts/CompanyContext';

interface YeniSozlesmeFormProps {
  onClose: () => void;
}

export default function YeniSozlesmeForm({ onClose }: YeniSozlesmeFormProps) {
  const { currentCompany } = useCompany();
  const [baslik, setBaslik] = useState('');
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const [sozlesmeFile, setSozlesmeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!currentCompany) {
      setError('Lütfen önce bir şirket seçiniz.');
      setLoading(false);
      return;
    }

    try {
      // Dosyaları yükle
      let ndaUrl = '';
      let sozlesmeUrl = '';

      if (ndaFile) {
        const ndaRef = ref(storage, `sozlesmeler/${currentCompany.id}/nda/${ndaFile.name}`);
        await uploadBytes(ndaRef, ndaFile);
        ndaUrl = await getDownloadURL(ndaRef);
      }

      if (sozlesmeFile) {
        const sozlesmeRef = ref(storage, `sozlesmeler/${currentCompany.id}/sozlesme/${sozlesmeFile.name}`);
        await uploadBytes(sozlesmeRef, sozlesmeFile);
        sozlesmeUrl = await getDownloadURL(sozlesmeRef);
      }

      // Firestore'a şirkete özel koleksiyona kaydet
      const collectionName = `sozlesmeler-${currentCompany.id}`;
      await addDoc(collection(db, collectionName), {
        baslik,
        ndaUrl: ndaUrl || null,
        sozlesmeUrl: sozlesmeUrl || null,
        createdAt: Timestamp.now(),
      });

      alert('Sözleşme başarıyla eklendi!');
      onClose();
    } catch (err) {
      console.error('Sözleşme eklenirken hata:', err);
      setError('Sözleşme eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Sözleşme Başlığı
          </label>
          <input
            type="text"
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
            placeholder="Örn: ABC Şirketi İş Sözleşmesi"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              NDA Dosyası (İsteğe Bağlı)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setNdaFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:transition-colors file:duration-200 cursor-pointer"
              />
              {ndaFile && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-purple-700 bg-purple-100 rounded-lg p-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Seçildi: {ndaFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC veya DOCX formatında dosya yükleyebilirsiniz
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Sözleşme Dosyası (İsteğe Bağlı)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSozlesmeFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:transition-colors file:duration-200 cursor-pointer"
              />
              {sozlesmeFile && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-indigo-700 bg-indigo-100 rounded-lg p-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Seçildi: {sozlesmeFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC veya DOCX formatında dosya yükleyebilirsiniz
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Ekleniyor...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Sözleşme Ekle</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 