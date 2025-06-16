'use client'; // Client component olduğumuzu belirtelim
import { useState } from 'react';
import Modal from '@/components/Modal'; // Modal bileşeninizin yolunu kontrol edin
// Yeni oluşturduğumuz bileşenleri import edelim
import GelirlerTable from '@/components/GelirlerTable'; // GelirlerTable bileşenini import et
import YeniGelirForm from '@/components/YeniGelirForm'; // YeniGelirForm bileşenini import et
// Yeni oluşturduğumuz Aylık Hizmet Formu bileşenini import et
import YeniAylikHizmetForm from '@/components/YeniAylikHizmetForm'; // Doğru yolu kontrol edin
// Yeni GecmisGelirForm component'ini import edin
import GecmisGelirForm from '@/components/GecmisGelirForm';

export default function GelirlerPage() {
  const [isYeniGelirModalOpen, setIsYeniGelirModalOpen] = useState(false);
  // Yeni state: Aylık Hizmet Ekle modalı için
  const [isAylikHizmetModalOpen, setIsAylikHizmetModalOpen] = useState(false);
  // Yeni state for Geçmiş Gelir modal
  const [isGecmisGelirModalOpen, setIsGecmisGelirModalOpen] = useState(false);
  // Diğer state'ler ve fonksiyonlar buraya eklenebilir (filtreleme, arama vb.)

  const openYeniGelirModal = () => setIsYeniGelirModalOpen(true);
  const closeYeniGelirModal = () => setIsYeniGelirModalOpen(false);

  const openAylikHizmetModal = () => setIsAylikHizmetModalOpen(true);
  const closeAylikHizmetModal = () => setIsAylikHizmetModalOpen(false);

  // Yeni handler functions for Geçmiş Gelir modal
  const openGecmisGelirModal = () => setIsGecmisGelirModalOpen(true);
  const closeGecmisGelirModal = () => setIsGecmisGelirModalOpen(false);

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Gelirler</h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={openYeniGelirModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                >
                  Yeni Gelir Ekle
                </button>
                <button
                  onClick={openAylikHizmetModal}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm lg:text-base"
                >
                  Aylık Hizmet Ekle
                </button>
                <button
                  onClick={openGecmisGelirModal}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm lg:text-base"
                >
                  Geçmiş Gelir Ekle
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <GelirlerTable />
          </div>

          {/* Yeni Gelir Ekle Modalı */}
          <Modal
            isOpen={isYeniGelirModalOpen}
            onClose={closeYeniGelirModal}
            title="Yeni Gelir Ekle"
          >
            <YeniGelirForm onClose={closeYeniGelirModal} />
          </Modal>

          {/* Aylık Hizmet Ekle Modalı */}
          <Modal
            isOpen={isAylikHizmetModalOpen}
            onClose={closeAylikHizmetModal}
            title="Aylık Hizmet Ekle"
          >
            <YeniAylikHizmetForm onClose={closeAylikHizmetModal} />
          </Modal>

          {/* Geçmiş Gelir Ekle Modalı */}
          <Modal
            isOpen={isGecmisGelirModalOpen}
            onClose={closeGecmisGelirModal}
            title="Geçmiş Gelir Ekle"
          >
            <GecmisGelirForm onClose={closeGecmisGelirModal} />
          </Modal>
        </div>
      </div>
    </div>
  );
} 