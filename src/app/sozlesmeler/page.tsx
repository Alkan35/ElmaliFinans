'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SozlesmelerTable from '@/components/SozlesmelerTable';
import Modal from '@/components/Modal';
import YeniSozlesmeForm from '@/components/YeniSozlesmeForm';

export default function Sozlesmeler() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                Sözleşmeler
              </h1>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sözleşme Ekle
              </button>
            </div>

            <SozlesmelerTable />

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            >
              <YeniSozlesmeForm />
            </Modal>
          </div>
        </div>
      </main>
    </div>
  );
} 