import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface YeniSozlesmeFormProps {
  onClose: () => void;
}

export default function YeniSozlesmeForm({ onClose }: YeniSozlesmeFormProps) {
  const [baslik, setBaslik] = useState('');
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const [sozlesmeFile, setSozlesmeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Dosyaları yükle
      let ndaUrl = '';
      let sozlesmeUrl = '';

      if (ndaFile) {
        const ndaRef = ref(storage, `sozlesmeler/nda/${ndaFile.name}`);
        await uploadBytes(ndaRef, ndaFile);
        ndaUrl = await getDownloadURL(ndaRef);
      }

      if (sozlesmeFile) {
        const sozlesmeRef = ref(storage, `sozlesmeler/sozlesme/${sozlesmeFile.name}`);
        await uploadBytes(sozlesmeRef, sozlesmeFile);
        sozlesmeUrl = await getDownloadURL(sozlesmeRef);
      }

      // Firestore'a kaydet
      await addDoc(collection(db, 'sozlesmeler'), {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Sözleşme Başlığı</label>
        <input
          type="text"
          value={baslik}
          onChange={(e) => setBaslik(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">NDA Dosyası (PDF/Word)</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setNdaFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Sözleşme Dosyası (PDF/Word)</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setSozlesmeFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Ekleniyor...' : 'Ekle'}
        </button>
      </div>
    </form>
  );
} 