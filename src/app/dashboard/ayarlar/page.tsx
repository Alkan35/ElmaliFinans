'use client';
import Link from 'next/link';
import { FiSettings, FiUsers, FiEdit } from 'react-icons/fi';

export default function AyarlarPage() {
  const ayarKartlari = [
    {
      title: 'Gider Başlıkları',
      description: 'Gider kategorilerini yönetin ve düzenleyin',
      icon: FiSettings,
      href: '/ayarlar/gider-basliklari',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Çalışanlar',
      description: 'Personel bilgilerini görüntüleyin ve düzenleyin',
      icon: FiUsers,
      href: '/ayarlar/calisanlar',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Kayıtları Düzenle',
      description: 'Mevcut kayıtları düzenleyin ve güncelleyin',
      icon: FiEdit,
      href: '/ayarlar/kayitlari-duzenle',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Ayarlar
            </h1>
            <p className="text-gray-600 mt-2">
              Sistem ayarlarını ve verileri yönetin
            </p>
          </div>
          
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {ayarKartlari.map((kart, index) => {
                const IconComponent = kart.icon;
                return (
                  <Link
                    key={index}
                    href={kart.href}
                    className="block group"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 group-hover:border-gray-300">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${kart.color} text-white mb-4 transition-all duration-300`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                        {kart.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {kart.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 