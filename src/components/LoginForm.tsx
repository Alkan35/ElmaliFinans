import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Firebase auth import
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Giriş başarılı, dashboard'a yönlendir
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Giriş hatası:', error);
      // Firebase hata kodlarına göre Türkçe mesajlar
      const err = error as { code?: string };
      if (err.code === 'auth/user-not-found') {
        setError('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Şifre yanlış. Lütfen kontrol ediniz.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta formatı.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Bu hesap devre dışı bırakılmış.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyiniz.');
      } else {
        setError('Giriş yaparken bir hata oluştu. Lütfen tekrar deneyiniz.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white shadow-2xl rounded-2xl px-8 pt-8 pb-8 border border-gray-100">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/Elmali Logo.png" alt="Elmalı Finans" className="h-12 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoş Geldiniz</h2>
          <p className="text-gray-600 text-sm">Devam etmek için giriş yapınız</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* E-posta Alanı */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
              E-posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-700 placeholder-gray-400"
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Şifre Alanı */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-700 placeholder-gray-400"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Giriş Butonu */}
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Giriş Yapılıyor...
              </div>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        {/* Alt Bilgi */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Güvenli giriş için Firebase Authentication kullanılmaktadır.
          </p>
        </div>
      </div>
    </div>
  );
} 