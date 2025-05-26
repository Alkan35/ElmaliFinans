import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Firebase auth import

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Giriş başarılı, ana sayfaya yönlendir
      router.push('/');
    } catch (err: any) {
      console.error('Giriş hatası:', err);
      // Firebase hata kodlarına göre daha spesifik mesajlar gösterebilirsiniz
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-posta veya şifre yanlış.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta formatı.');
      }
      else {
        setError('Giriş yaparken bir hata oluştu: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex justify-center mb-6">
           <img src="/Elmali Logo.png" alt="Logo" className="h-12" />
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Yönetim Paneli Girişi</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            E-posta
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="E-posta Adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Şifre
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="text-red-500 text-xs italic mb-4">{error}</div>
        )}
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </form>
    </div>
  );
} 