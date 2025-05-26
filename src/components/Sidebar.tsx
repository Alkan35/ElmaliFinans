import Link from 'next/link';
import { FiSettings, FiUsers, FiEdit, FiHome, FiTrendingUp, FiTrendingDown, FiFileText } from 'react-icons/fi';

export default function Sidebar({ settings = false, active = '' }) {
  if (settings) {
    return (
      <nav className="settings-menu">
        <Link href="/ayarlar/gider-basliklari" className={`settings-menu-btn${active === 'gider-basliklari' ? ' active' : ''}`}>
          <FiSettings className="text-lg" />
          Gider Başlıkları
        </Link>
        <Link href="/ayarlar/calisanlar" className={`settings-menu-btn${active === 'calisanlar' ? ' active' : ''}`}>
          <FiUsers className="text-lg" />
          Çalışanlar
        </Link>
        <Link href="/ayarlar/kayitlari-duzenle" className={`settings-menu-btn${active === 'kayitlari-duzenle' ? ' active' : ''}`}>
          <FiEdit className="text-lg" />
          Kayıtları Düzenle
        </Link>
      </nav>
    );
  }
  return (
    <aside className="sidebar w-60 h-screen fixed left-0 top-0 bg-white shadow-xl rounded-r-3xl flex flex-col justify-between py-8 z-30">
      <div>
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src="/Elmali Logo.png" alt="Logo" className="h-10" />
        </div>
        <nav className="flex flex-col gap-2 px-2">
          <Link href="/" className="sidebar-link">
            <FiHome className="sidebar-icon" />
            <span>Dashboard</span>
          </Link>
          <Link href="/gelirler" className="sidebar-link">
            <FiTrendingUp className="sidebar-icon" />
            <span>Gelirler</span>
          </Link>
          <Link href="/giderler" className="sidebar-link">
            <FiTrendingDown className="sidebar-icon" />
            <span>Giderler</span>
          </Link>
          <Link href="/sozlesmeler" className="sidebar-link">
            <FiFileText className="sidebar-icon" />
            <span>Sözleşmeler</span>
          </Link>
          <Link href="/ayarlar" className="sidebar-link">
            <FiSettings className="sidebar-icon" />
            <span>Ayarlar</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
} 