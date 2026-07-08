import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';

const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="76" fill="none" viewBox="0 0 48 46">
    <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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
    <div className="relative flex flex-col lg:flex-row h-screen w-full overflow-y-auto lg:overflow-hidden bg-black font-sans">

      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Center top glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(134,59,255,0.25) 0%, rgba(134,59,255,0.05) 50%, transparent 70%)' }}
        />
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(134,59,255,0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* === LEFT SECTION — Branding === */}
      <div className="relative z-10 flex w-full lg:w-[35%] flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shrink-0">
        {/* Logo mark top-left */}
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-white font-black text-xl tracking-tight">
            ALL<span className="text-purple-400">Finance</span>
          </span>
        </div>

        {/* Main tagline */}
        <div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Kelola<br />Keuangan<br />Anda
          </h1>
          <div className="flex flex-col gap-2 text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            <span>Lacak Pemasukan &amp; Pengeluaran</span>
            <span>Laporan Keuangan Real-time</span>
          </div>
        </div>

        {/* Bottom subtle version text */}
        <p className="text-xs text-gray-200 font-medium">ALLFinance v2.0 — Financial Tracker</p>
      </div>

      {/* === CENTER SECTION — Glowing Logo === */}
      <div className="relative z-10 hidden lg:flex flex-1 items-center justify-center shrink-0">
        <div className="flex flex-col items-center gap-6">
          {/* Outer glow ring */}
          <div className="relative flex items-center justify-center">
            {/* Multiple glow layers */}
            <div className="absolute w-[280px] h-[280px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(134,59,255,0.3) 0%, transparent 70%)' }}
            />
            <div className="absolute w-[200px] h-[200px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(134,59,255,0.4) 0%, transparent 60%)' }}
            />
            <div className="absolute w-[140px] h-[140px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(134,59,255,0.5) 0%, transparent 50%)' }}
            />
            {/* The actual logo, large */}
            <div className="relative" style={{ filter: 'drop-shadow(0 0 40px rgba(134,59,255,0.8)) drop-shadow(0 0 80px rgba(134,59,255,0.4))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="115" fill="none" viewBox="0 0 48 46">
                <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#c084fc"/>
                    <stop offset="100%" stopColor="#7e14ff"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Subtle line divider */}
          <div className="flex items-center gap-3 mt-2">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-500/40" />
            <span className="text-xs font-bold text-purple-400/60 tracking-[0.3em] uppercase">Finance</span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-500/40" />
          </div>
        </div>
      </div>

      {/* === RIGHT SECTION — Login Form === */}
      <div className="relative z-10 flex w-full lg:w-[35%] flex-col justify-center p-8 lg:p-12 lg:border-l border-white/5 flex-1 lg:flex-none">
        <div className="w-full max-w-sm mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Selamat Datang</h2>
            <p className="text-sm text-gray-400 font-medium">Masuk untuk melanjutkan ke akun Anda</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 font-medium outline-none transition-all focus:border-purple-500/60 focus:bg-white/8 focus:ring-1 focus:ring-purple-500/30"
                style={{ backdropFilter: 'blur(4px)' }}
              />
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
              {/* Button inner glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0 opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-300 font-bold">atau</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-300 font-medium">
            Belum punya akun?{' '}
            <Link to="/register" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Horizontal line across full width */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
    </div>
  );
};

export default Login;
