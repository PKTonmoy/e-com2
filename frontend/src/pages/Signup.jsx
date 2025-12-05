import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api.js';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/signup', form);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lux-container py-16 flex justify-center">
      <form onSubmit={submit} className="lux-card p-6 space-y-4 w-full max-w-md" autoComplete="off">
        <h1 className="lux-heading">Join PRELUX</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <input
          className="w-full border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte"
          placeholder="Name"
          name="name"
          autoComplete="new-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
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
          placeholder="Password (min. 6 characters)"
          type="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={6}
          required
        />
        <button
          className="lux-btn-primary w-full disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Already a client? <Link to="/login" className="underline text-gold">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
