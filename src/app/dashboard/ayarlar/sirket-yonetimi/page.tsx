'use client';

import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { FiBriefcase, FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from 'react-icons/fi';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header Section with Modern Design */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 lg:px-8 py-6 lg:py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Title Section */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <FiBriefcase className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Şirket Yönetimi
                    </h1>
                    <p className="text-blue-100 text-lg mt-1">
                      Şirketlerinizi yönetin ve organizasyonunuzu düzenleyin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Yeni Şirket Oluştur */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">
            <div className="p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <FiPlus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Yeni Şirket Oluştur</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Şirket adını giriniz..."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCompany()}
                  />
                </div>
                <button
                  onClick={handleCreateCompany}
                  disabled={!newCompanyName.trim() || creating}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          </div>

          {/* Mevcut Şirketler */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">
            <div className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                    <FiBriefcase className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Mevcut Şirketler</h2>
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-full">
                  <span className="text-blue-700 font-semibold text-sm">{userCompanies.length} Şirket</span>
                </div>
              </div>

              {userCompanies.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <FiBriefcase className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz şirket bulunmuyor</h3>
                  <p className="text-gray-500">Yukarıdan yeni şirket oluşturarak başlayabilirsiniz</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {userCompanies.map((company) => (
                    <div
                      key={company.id}
                      className={`group relative bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        currentCompany?.id === company.id
                          ? 'border-blue-400 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-lg shadow-blue-500/20'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Aktif şirket işareti */}
                      {currentCompany?.id === company.id && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full p-2 shadow-lg">
                            <FiCheck className="h-4 w-4" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`p-3 rounded-xl ${
                            currentCompany?.id === company.id 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-indigo-600'
                          } transition-all duration-300`}>
                            <FiBriefcase className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingCompany === company.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-lg font-bold text-gray-800 bg-white/80 border border-blue-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditCancel();
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <h3 className="text-lg font-bold text-gray-800 truncate">{company.name}</h3>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(company.createdAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Şirket İşlemleri */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          {editingCompany === company.id ? (
                            <>
                              <button
                                onClick={handleEditCancel}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="İptal"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  handleEditCancel();
                                  toast.success('Şirket adı güncellendi');
                                }}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Kaydet"
                              >
                                <FiCheck className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditStart(company.id, company.name)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
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
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Şirketi sil"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {currentCompany?.id !== company.id ? (
                          <button
                            onClick={() => handleCompanySelect(company)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            Seç
                          </button>
                        ) : (
                          <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-md">
                            ✓ Aktif
                          </div>
                        )}
                      </div>
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