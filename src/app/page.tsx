import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Dashboard
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gelir Kartı */}
              <div className="bg-green-50 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-green-700 mb-2">Toplam Gelir</h2>
                <p className="text-3xl font-bold text-green-600">₺0.00</p>
              </div>

              {/* Gider Kartı */}
              <div className="bg-red-50 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-red-700 mb-2">Toplam Gider</h2>
                <p className="text-3xl font-bold text-red-600">₺0.00</p>
              </div>

              {/* Bakiye Kartı */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-blue-700 mb-2">Güncel Bakiye</h2>
                <p className="text-3xl font-bold text-blue-600">₺0.00</p>
              </div>
            </div>

            {/* Son İşlemler Tablosu */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Son İşlemler</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Henüz işlem yok</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
