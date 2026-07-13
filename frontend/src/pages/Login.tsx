import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';

const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="76" fill="none" viewBox="0 0 48 46" className="w-12 h-12 lg:w-[80px] lg:h-[76px]">
    <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const reason = localStorage.getItem('logout_reason');
    if (reason === 'deleted') {
      toast.error('Akun Anda telah dihapus secara permanen.');
      localStorage.removeItem('logout_reason');
    } else if (reason === 'expired') {
      toast.error('Sesi Anda telah berakhir, silakan masuk kembali.');
      localStorage.removeItem('logout_reason');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau kata sandi salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen w-full bg-black font-sans overflow-x-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="w-[80%] h-[80%] lg:w-[500px] lg:h-[500px] rounded-full blur-[100px]"
          style={{ background: 'rgba(134,59,255,0.15)' }}
        />
      </div>

      {/* === LEFT SECTION — Branding === */}
      <div className="relative z-10 flex w-full lg:w-[40%] flex-col justify-center lg:justify-between p-6 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5">
        <div className="flex flex-col gap-6 lg:gap-0 h-full lg:justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-white font-black text-xl lg:text-2xl tracking-tight">
              ALL<span className="text-purple-400">Finance</span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-3 lg:mb-6">
              Kelola<br />Keuangan<br />Anda
            </h1>
            <div className="flex flex-col gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-bold tracking-widest uppercase text-gray-400">
              <span>Lacak Pemasukan & Pengeluaran</span>
              <span>Laporan Keuangan Real-time</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 font-medium hidden lg:block">ALLFinance v2.0 — Financial Tracker</p>
        </div>
      </div>

      {/* === RIGHT SECTION — Login Form === */}
      <div className="relative z-10 flex w-full lg:w-[60%] flex-col justify-center p-6 sm:p-8 lg:p-12 lg:border-l border-white/5">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">Selamat Datang</h2>
            <p className="text-sm text-gray-400 font-medium">Masuk untuk melanjutkan ke akun Anda</p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 font-medium outline-none transition-all focus:border-purple-500/60 focus:bg-white/8 focus:ring-1 focus:ring-purple-500/30"
                style={{ backdropFilter: 'blur(4px)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 font-medium outline-none transition-all focus:border-purple-500/60 focus:bg-white/8 focus:ring-1 focus:ring-purple-500/30"
                  style={{ backdropFilter: 'blur(4px)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg px-4 py-3 text-sm font-black text-white transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7e14ff, #863bff)',
                boxShadow: '0 0 20px rgba(134,59,255,0.4), 0 4px 15px rgba(0,0,0,0.3)'
              }}
            >
              <span className="relative z-10">
                {loading ? 'Memverifikasi...' : 'Masuk →'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0 opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-300 font-bold">atau</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <p className="text-center text-sm text-gray-300 font-medium">
            Belum punya akun?{' '}
            <Link to="/register" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
