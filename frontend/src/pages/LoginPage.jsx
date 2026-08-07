import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import RoleBadge from '../components/RoleBadge';
import TopNav from '../components/TopNav';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'operations', label: 'Operations Officer' },
  { value: 'accounts', label: 'Accounts Officer' }
];

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('manager');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@cps.local');
  const [password, setPassword] = useState('demo1234');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = mode === 'register'
        ? { name, email, password, role: 'customer' }
        : { email, password, role };

      const response = await authService.login({ ...payload, mode });
      const user = response.data?.data?.user;
      if (user) {
        localStorage.setItem('cps-user', JSON.stringify(user));
        setMessage(`Welcome ${user.name} (${user.roleLabel})`);
        navigate('/');
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-cps-navy p-8 text-white">
              <h1 className="text-3xl font-extrabold">CPS Authentication</h1>
              <p className="mt-3 text-sm text-slate-200">Choose to log in with an existing account or create a new customer account. Internal staff members can pick their role before login.</p>
              <div className="mt-8 rounded bg-white/10 p-4">
                <p className="text-sm font-semibold">Role selection before login</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roleOptions.map((option) => <RoleBadge key={option.value} role={option.value} />)}
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="flex rounded bg-slate-100 p-1">
                <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded px-3 py-2 text-sm font-bold ${mode === 'login' ? 'bg-cps-navy text-white' : 'text-slate-700'}`}>Login</button>
                <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded px-3 py-2 text-sm font-bold ${mode === 'register' ? 'bg-cps-maroon text-white' : 'text-slate-700'}`}>Register</button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === 'register' ? (
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Full name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Enter your name" />
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-sm font-semibold">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="you@example.com" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Enter password" />
                </div>

                {mode === 'login' ? (
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Select role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2">
                      {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="rounded bg-slate-100 p-3 text-sm text-slate-700">Register is for customers only. Staff roles are handled through the login option.</div>
                )}

                <button className="w-full rounded bg-cps-navy px-4 py-3 font-bold text-white">{mode === 'register' ? 'Create account' : 'Login'}</button>
              </form>

              {message ? <div className="mt-4 rounded bg-slate-100 p-3 text-sm text-slate-700">{message}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
