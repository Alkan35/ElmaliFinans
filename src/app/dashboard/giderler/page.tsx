'use client';
import { useState } from 'react';
import GiderlerTable from '@/components/GiderlerTable';
import Modal from '@/components/Modal';
import YeniGiderForm from '@/components/YeniGiderForm';
import GecmisGiderForm from '@/components/GecmisGiderForm';

export default function Giderler() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGecmisModalOpen, setIsGecmisModalOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Giderler
              </h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={() => setIsGecmisModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm lg:text-base"
                >
                  Geçmiş Gider Ekle
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                >
                  Yeni Gider Ekle
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <GiderlerTable />
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Yeni Gider Ekle"
          >
            <YeniGiderForm />
          </Modal>

          <Modal 
            isOpen={isGecmisModalOpen} 
            onClose={() => setIsGecmisModalOpen(false)}
            title="Geçmiş Gider Ekle"
          >
            <GecmisGiderForm onClose={() => setIsGecmisModalOpen(false)} />
          </Modal>
        </div>
      </div>
    </div>
  );
} 