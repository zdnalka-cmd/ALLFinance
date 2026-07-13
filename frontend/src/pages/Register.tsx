import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axiosInstance.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran gagal');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d1a] font-sans p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111120] p-8 shadow-xl">
        <h2 className="mb-2 text-3xl font-black text-white tracking-tight">Buat Akun</h2>
        <p className="mb-6 text-sm text-gray-400 font-bold">Daftar ke ALLFinance CRM</p>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-200">Nama Lengkap</label>
            <input 
              type="text" 
              className="w-full rounded-lg border border-white/15 p-2.5 font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-200">Alamat Email</label>
            <input 
              type="email" 
              className="w-full rounded-lg border border-white/15 p-2.5 font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
              placeholder="nama@perusahaan.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-200">Kata Sandi</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full rounded-lg border border-white/15 p-2.5 pr-10 font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full rounded-lg bg-purple-600 p-2.5 font-bold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            Buat Akun
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm font-bold text-gray-400">
          Sudah punya akun? <Link to="/login" className="text-purple-600 hover:text-purple-700 hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
