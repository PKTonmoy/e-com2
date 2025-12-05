import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get the redirect path from state, or default to home
  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);

      // Invalidate 'me' query to ensure fresh user data
      await queryClient.invalidateQueries(['me']);

      // Redirect to admin if user is admin, otherwise to intended page
      if (res.data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lux-container py-16 flex justify-center">
      <form onSubmit={submit} className="lux-card p-6 space-y-4 w-full max-w-md" autoComplete="off">
        <h1 className="lux-heading">Welcome back</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <input
          className="w-full border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte"
          placeholder="Email"
          type="email"
          name="email"
          autoComplete="new-email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte"
          placeholder="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button
          className="lux-btn-primary w-full disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          New to PRELUX? <Link to="/signup" className="underline text-gold">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
