'use client';
import GiderBasliklari from '@/components/GiderBasliklari';

export default function GiderBasliklariPage() {
  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Gider Başlıkları
            </h1>
          </div>
          <div className="p-4 lg:p-6">
            <GiderBasliklari />
          </div>
        </div>
      </div>
    </div>
  );
} 