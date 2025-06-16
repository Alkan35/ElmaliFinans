'use client';
import { useState } from 'react';
import SozlesmelerTable from '@/components/SozlesmelerTable';
import Modal from '@/components/Modal';
import YeniSozlesmeForm from '@/components/YeniSozlesmeForm';

export default function Sozlesmeler() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Sözleşmeler
              </h1>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
              >
                Sözleşme Ekle
              </button>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <SozlesmelerTable />
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Sözleşme Ekle"
          >
            <YeniSozlesmeForm onClose={() => setIsModalOpen(false)} />
          </Modal>
        </div>
      </div>
    </div>
  );
} 