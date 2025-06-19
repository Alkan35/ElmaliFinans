'use client';

import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { FiBriefcase, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SirketYonetimiPage() {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const { user } = useAuth();
  const {
    currentCompany,
    userCompanies,
    setCurrentCompany,
    createCompany,
    loading
  } = useCompany();

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim() || !user) {
      toast.error('Şirket adı boş olamaz');
      return;
    }
    
    setCreating(true);
    try {
      const newCompany = await createCompany(newCompanyName.trim(), user);
      setNewCompanyName('');
      toast.success(`${newCompany.name} şirketi başarıyla oluşturuldu`);
    } catch (error) {
      console.error('Şirket oluşturma hatası:', error);
      toast.error('Şirket oluşturulurken bir hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const handleEditStart = (companyId: string, companyName: string) => {
    setEditingCompany(companyId);
    setEditName(companyName);
  };

  const handleEditCancel = () => {
    setEditingCompany(null);
    setEditName('');
  };

  const handleCompanySelect = (company: { id: string; name: string; createdBy: string; createdAt: Date }) => {
    setCurrentCompany(company);
    toast.success(`${company.name} şirketi seçildi`);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-4 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Şirket Yönetimi</h1>
            <p className="text-gray-600 mt-2">Şirketlerinizi yönetin, yeni şirket oluşturun veya mevcut şirketi seçin.</p>
          </div>

          <div className="p-4 lg:p-6">
            {/* Yeni Şirket Oluştur */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiPlus className="mr-2" />
                Yeni Şirket Oluştur
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Şirket adını giriniz"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCompany()}
                />
                <button
                  onClick={handleCreateCompany}
                  disabled={!newCompanyName.trim() || creating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <FiPlus className="mr-2" />
                      Şirket Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mevcut Şirketler */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiBriefcase className="mr-2" />
                Mevcut Şirketler ({userCompanies.length})
              </h2>

              {userCompanies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiBriefcase className="mx-auto h-12 w-12 mb-4" />
                  <p>Henüz şirket bulunmuyor.</p>
                  <p className="text-sm">Yukarıdan yeni şirket oluşturabilirsiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userCompanies.map((company) => (
                    <div
                      key={company.id}
                      className={`relative bg-white border-2 rounded-lg p-6 transition-all duration-200 hover:shadow-md ${
                        currentCompany?.id === company.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Aktif şirket işareti */}
                      {currentCompany?.id === company.id && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <FiBriefcase className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            {editingCompany === company.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-lg font-semibold text-gray-800 bg-transparent border-b border-blue-500 focus:outline-none"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditCancel();
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
                            )}
                            <p className="text-sm text-gray-500">
                              Oluşturulma: {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Şirket İşlemleri */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {editingCompany === company.id ? (
                            <>
                              <button
                                onClick={handleEditCancel}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                İptal
                              </button>
                              <button
                                onClick={() => {
                                  handleEditCancel();
                                  toast.success('Şirket adı güncellendi');
                                }}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Kaydet
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditStart(company.id, company.name)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Şirket adını düzenle"
                              >
                                <FiEdit className="h-4 w-4" />
                              </button>
                              {userCompanies.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (confirm(`${company.name} şirketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                                      toast.error('Şirket silme özelliği henüz aktif değil');
                                    }
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Şirketi sil"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {currentCompany?.id !== company.id && (
                          <button
                            onClick={() => handleCompanySelect(company)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Seç
                          </button>
                        )}
                      </div>

                      {currentCompany?.id === company.id && (
                        <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800 text-center">
                          ✓ Aktif Şirket
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 