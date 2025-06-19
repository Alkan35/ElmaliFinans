'use client';
import { useState } from 'react';
import SozlesmelerTable from '@/components/SozlesmelerTable';
import Modal from '@/components/Modal';
import YeniSozlesmeForm from '@/components/YeniSozlesmeForm';

export default function Sozlesmeler() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40">
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header Section with Modern Design */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-purple-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-6 lg:px-8 py-6 lg:py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Title Section */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Sözleşme Yönetimi
                    </h1>
                    <p className="text-purple-100 text-lg mt-1">
                      Sözleşmelerinizi ve NDA&apos;larınızı güvenli şekilde saklayın
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="group flex items-center justify-center px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Yeni Sözleşme Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-purple-500/5 overflow-hidden">
          <div className="p-6 lg:p-8">
            <SozlesmelerTable />
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Yeni Sözleşme Ekle"
        >
          <YeniSozlesmeForm onClose={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </div>
  );
} 