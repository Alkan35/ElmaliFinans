'use client';

import Link from 'next/link';
import { FiSettings, FiUsers, FiEdit, FiHome, FiTrendingUp, FiTrendingDown, FiFileText, FiMenu, FiX, FiChevronDown, FiChevronRight, FiLogOut, FiBriefcase } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function Sidebar({ settings = false, active = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAyarlarOpen, setIsAyarlarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Ayarlar sayfalarında ise dropdown'u açık tut
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/ayarlar/')) {
      setIsAyarlarOpen(true);
    }
  }, [pathname]);

  // ESC tuşu ile menüyü kapatma
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Çıkış işlemi
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast.success('Başarıyla çıkış yaptınız');
      router.push('/');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yaparken bir hata oluştu');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (settings) {
    return (
      <nav className="settings-menu">
        <Link href="/dashboard/ayarlar/gider-basliklari" className={`settings-menu-btn${active === 'gider-basliklari' ? ' active' : ''}`}>
          <FiSettings className="text-lg" />
          Gider Başlıkları
        </Link>
        <Link href="/dashboard/ayarlar/calisanlar" className={`settings-menu-btn${active === 'calisanlar' ? ' active' : ''}`}>
          <FiUsers className="text-lg" />
          Çalışanlar
        </Link>
        <Link href="/dashboard/ayarlar/kayitlari-duzenle" className={`settings-menu-btn${active === 'kayitlari-duzenle' ? ' active' : ''}`}>
          <FiEdit className="text-lg" />
          Kayıtları Düzenle
        </Link>
      </nav>
    );
  }

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => pathname === path;
  const isActiveStartsWith = (path: string) => pathname?.startsWith(path);

  return (
    <>
      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-24 left-4 z-50 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Menüyü aç"
      >
        <FiMenu className="h-6 w-6 text-[#002366]" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        sidebar w-60 h-full fixed left-0 top-0 bg-white shadow-xl rounded-r-3xl flex flex-col justify-between py-8 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          aria-label="Menüyü kapat"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div>
          {/* Logo */}
          <div className="flex items-center justify-center mb-8 mt-4">
            <img src="/Elmali Logo.png" alt="Logo" className="h-10" />
          </div>
          <nav className="flex flex-col gap-2 px-2">
            <Link href="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={handleLinkClick}>
              <FiHome className="sidebar-icon" />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/gelirler" className={`sidebar-link ${isActive('/dashboard/gelirler') ? 'active' : ''}`} onClick={handleLinkClick}>
              <FiTrendingUp className="sidebar-icon" />
              <span>Gelirler</span>
            </Link>
            <Link href="/dashboard/giderler" className={`sidebar-link ${isActive('/dashboard/giderler') ? 'active' : ''}`} onClick={handleLinkClick}>
              <FiTrendingDown className="sidebar-icon" />
              <span>Giderler</span>
            </Link>
            <Link href="/dashboard/sozlesmeler" className={`sidebar-link ${isActive('/dashboard/sozlesmeler') ? 'active' : ''}`} onClick={handleLinkClick}>
              <FiFileText className="sidebar-icon" />
              <span>Sözleşmeler</span>
            </Link>
            
            {/* Ayarlar Dropdown */}
            <div>
              <button
                onClick={() => setIsAyarlarOpen(!isAyarlarOpen)}
                className={`sidebar-link w-full flex items-center justify-between ${isActiveStartsWith('/dashboard/ayarlar') ? 'active' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <FiSettings className="sidebar-icon" />
                  <span>Ayarlar</span>
                </div>
                {isAyarlarOpen ? (
                  <FiChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <FiChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              {/* Ayarlar Alt Menü */}
              {isAyarlarOpen && (
                <div className="ml-6 mt-2 space-y-1">
                  <Link 
                    href="/dashboard/ayarlar/gider-basliklari" 
                    className={`sidebar-sub-link ${isActive('/dashboard/ayarlar/gider-basliklari') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <FiSettings className="sidebar-sub-icon" />
                    <span>Gider Başlıkları</span>
                  </Link>
                  <Link 
                    href="/dashboard/ayarlar/calisanlar" 
                    className={`sidebar-sub-link ${isActive('/dashboard/ayarlar/calisanlar') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <FiUsers className="sidebar-sub-icon" />
                    <span>Çalışanlar</span>
                  </Link>
                  <Link 
                    href="/dashboard/ayarlar/kayitlari-duzenle" 
                    className={`sidebar-sub-link ${isActive('/dashboard/ayarlar/kayitlari-duzenle') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <FiEdit className="sidebar-sub-icon" />
                    <span>Kayıtları Düzenle</span>
                  </Link>
                  <Link 
                    href="/dashboard/ayarlar/sirket-yonetimi" 
                    className={`sidebar-sub-link ${isActive('/dashboard/ayarlar/sirket-yonetimi') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <FiBriefcase className="sidebar-sub-icon" />
                    <span>Şirket Yönetimi</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Çıkış Butonu */}
        <div className="px-2 border-t border-gray-200 pt-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="sidebar-link w-full flex items-center gap-4 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiLogOut className="sidebar-icon" />
            <span>{isLoggingOut ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}</span>
          </button>
        </div>
      </aside>
    </>
  );
} 