import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import useEmailValidation, { VALIDATION_MESSAGES } from '../lib/useEmailValidation.js';

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const navigate = useNavigate();

  // Email validation hook
  const {
    isValid: emailIsValid,
    isValidating: emailIsValidating,
    error: emailError,
    reason: emailReason,
    needsConfirmation,
    suggestion,
    validate: validateEmail,
    validateRegex,
    reset: resetEmailValidation,
  } = useEmailValidation();

  // Debounce email validation
  useEffect(() => {
    if (!emailTouched || !form.email) {
      resetEmailValidation();
      return;
    }

    if (!validateRegex(form.email)) {
      return;
    }

    const timer = setTimeout(() => {
      validateEmail(form.email);
    }, 500);

    return () => clearTimeout(timer);
  }, [form.email, emailTouched, validateEmail, validateRegex, resetEmailValidation]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!form.phone || !form.address) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate email before submission
    if (!emailIsValid && !needsConfirmation) {
      if (emailIsValid === null) {
        const result = await validateEmail(form.email);
        if (!result.isValid && !result.needsConfirmation) {
          setError(result.error || 'Please enter a valid email address.');
          return;
        }
      } else {
        setError(emailError || 'Please enter a valid email address.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/signup', {
        ...form,
        emailVerified: emailIsValid && !needsConfirmation,
      });
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmailStatus = () => {
    if (!emailTouched || !form.email) return null;
    if (emailIsValidating) return 'loading';
    if (!validateRegex(form.email)) return 'invalid';
    if (emailIsValid === true) return 'valid';
    if (needsConfirmation) return 'warning';
    if (emailIsValid === false && emailReason !== 'validation_service_unavailable') return 'invalid';
    return null;
  };

  const emailStatus = getEmailStatus();

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 flex justify-center">
      <form onSubmit={submit} className="bg-white dark:bg-neutral-900 rounded-xl p-6 sm:p-8 shadow-sm border border-neutral-100 dark:border-neutral-800 space-y-5 w-full max-w-md" autoComplete="off">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-matte dark:text-ivory">Join PRELUX</h1>
          <p className="text-sm text-neutral-500 mt-1">Create your account</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Full Name *</label>
          <input
            className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            placeholder="John Doe"
            name="name"
            autoComplete="new-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        {/* Email with validation */}
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Email *</label>
          <div className="relative">
            <input
              className={`w-full border p-3 rounded-lg bg-transparent text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-gold/30 ${emailStatus === 'invalid'
                  ? 'border-red-400 dark:border-red-600'
                  : emailStatus === 'valid'
                    ? 'border-emerald-400 dark:border-emerald-600'
                    : emailStatus === 'warning'
                      ? 'border-amber-400 dark:border-amber-600'
                      : 'border-neutral-200 dark:border-neutral-700'
                }`}
              placeholder="john@example.com"
              type="email"
              name="email"
              autoComplete="new-email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setEmailTouched(true)}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {emailIsValidating && (
                <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              )}
              {emailStatus === 'valid' && !emailIsValidating && (
                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
              )}
              {emailStatus === 'invalid' && !emailIsValidating && (
                <XCircleIcon className="w-5 h-5 text-red-500" />
              )}
              {emailStatus === 'warning' && !emailIsValidating && (
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              )}
            </div>
          </div>
          {emailTouched && form.email && emailError && validateRegex(form.email) && (
            <p className={`text-xs mt-1 ${needsConfirmation ? 'text-amber-600' : 'text-red-500'}`}>
              {emailError}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Mobile Number *</label>
          <input
            className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            placeholder="+1 234 567 8900"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Address *</label>
          <input
            className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            placeholder="123 Main Street, City, Country"
            name="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Password *</label>
          <input
            className="w-full border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            placeholder="Min. 6 characters"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
        </div>

        <button
          className="w-full py-3 bg-gold text-matte font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-gold/90 transition disabled:opacity-50"
          type="submit"
          disabled={loading || emailIsValidating || (emailStatus === 'invalid' && !needsConfirmation)}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-500">or</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <a
          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google`}
          className="w-full flex items-center justify-center gap-3 border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Continue with Google</span>
        </a>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
          Already a client? <Link to="/login" className="text-gold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
