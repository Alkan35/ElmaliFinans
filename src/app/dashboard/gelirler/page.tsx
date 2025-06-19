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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header Section with Modern Design */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 lg:px-8 py-6 lg:py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Title Section */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Gelir Yönetimi
                    </h1>
                    <p className="text-blue-100 text-lg mt-1">
                      Gelirlerinizi takip edin ve yönetin
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={openYeniGelirModal}
                    className="group flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Yeni Gelir
                  </button>
                  
                  <button
                    onClick={openAylikHizmetModal}
                    className="group flex items-center justify-center px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Aylık Hizmet
                  </button>
                  
                  <button
                    onClick={openGecmisGelirModal}
                    className="group flex items-center justify-center px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Geçmiş Gelir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">
          <div className="p-6 lg:p-8">
            <GelirlerTable />
          </div>
        </div>

        {/* Modals */}
        <Modal
          isOpen={isYeniGelirModalOpen}
          onClose={closeYeniGelirModal}
          title="Yeni Gelir Ekle"
        >
          <YeniGelirForm onClose={closeYeniGelirModal} />
        </Modal>

        <Modal
          isOpen={isAylikHizmetModalOpen}
          onClose={closeAylikHizmetModal}
          title="Aylık Hizmet Ekle"
        >
          <YeniAylikHizmetForm onClose={closeAylikHizmetModal} />
        </Modal>

        <Modal
          isOpen={isGecmisGelirModalOpen}
          onClose={closeGecmisGelirModal}
          title="Geçmiş Gelir Ekle"
        >
          <GecmisGelirForm onClose={closeGecmisGelirModal} />
        </Modal>
      </div>
    </div>
  );
} 