'use client'; // Client component olduğumuzu belirtelim
import { useState } from 'react';
import Sidebar from '@/components/Sidebar'; // Sidebar bileşeninizin yolunu kontrol edin
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
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Gelirler</h1>
              <div className="space-x-4">
                {/* Yeni Gelir Ekle butonu */}
                <button
                  onClick={openYeniGelirModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Yeni Gelir Ekle
                </button>
                {/* Yeni buton: Aylık Hizmet Ekle */}
                <button
                  onClick={openAylikHizmetModal}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Aylık Hizmet Ekle
                </button>
                {/* Yeni Geçmiş Gelir Ekle Butonu */}
                <button
                  onClick={openGecmisGelirModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Geçmiş Gelir Ekle
                </button>
              </div>
            </div>

            {/* Gelirler Tabloları Bileşeni buraya gelecek */}
            <GelirlerTable />

            {/* Yeni Gelir Ekle Modalı */}
            <Modal
              isOpen={isYeniGelirModalOpen}
              onClose={closeYeniGelirModal}
              title="Yeni Gelir Ekle"
            >
              {/* Yeni Gelir Formu Bileşeni buraya gelecek */}
              <YeniGelirForm onClose={closeYeniGelirModal} />
            </Modal>

            {/* Yeni Modal: Aylık Hizmet Ekle */}
            <Modal
              isOpen={isAylikHizmetModalOpen}
              onClose={closeAylikHizmetModal}
              title="Aylık Hizmet Ekle"
            >
              {/* Yeni Aylık Hizmet Formu Bileşeni buraya gelecek */}
              <YeniAylikHizmetForm onClose={closeAylikHizmetModal} />
            </Modal>

            {/* Yeni Geçmiş Gelir Ekle Modal */}
            <Modal
              isOpen={isGecmisGelirModalOpen}
              onClose={closeGecmisGelirModal}
              title="Geçmiş Gelir Ekle"
            >
              {/* GecmisGelirForm component'ini buraya ekleyin */}
              <GecmisGelirForm onClose={closeGecmisGelirModal} />
            </Modal>

            {/* Diğer Modallar (örn: Düzenleme Modalı) buraya gelebilir */}

          </div>
        </div>
      </main>
    </div>
  );
} 