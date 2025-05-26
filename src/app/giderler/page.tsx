'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import GiderlerTable from '@/components/GiderlerTable';
import Modal from '@/components/Modal';
import YeniGiderForm from '@/components/YeniGiderForm';
import GecmisGiderForm from '@/components/GecmisGiderForm';

export default function Giderler() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGecmisModalOpen, setIsGecmisModalOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                Giderler
              </h1>
              <div className="space-x-4">
                <button
                  onClick={() => setIsGecmisModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Geçmiş Gider Ekle
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Yeni Gider Ekle
                </button>
              </div>
            </div>

            <GiderlerTable />

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
              <GecmisGiderForm />
            </Modal>
          </div>
        </div>
      </main>
    </div>
  );
} 