import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import useEmailValidation, { VALIDATION_MESSAGES } from '../lib/useEmailValidation.js';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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

    // Quick regex check for immediate feedback
    if (!validateRegex(form.email)) {
      return;
    }

    // Debounce the API call
    const timer = setTimeout(() => {
      validateEmail(form.email);
    }, 500);

    return () => clearTimeout(timer);
  }, [form.email, emailTouched, validateEmail, validateRegex, resetEmailValidation]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email before submission
    if (!emailIsValid && !needsConfirmation) {
      // Trigger validation if not done
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
        // Flag if email needs verification
        emailVerified: emailIsValid && !needsConfirmation,
      });
      localStorage.setItem('token', res.data.token);

      // Show different message based on verification status
      if (needsConfirmation) {
        // Could show a toast or redirect to verification page
        console.log('Email requires verification');
      }

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get email field status
  const getEmailStatus = () => {
    if (!emailTouched || !form.email) return null;
    if (emailIsValidating) return 'loading';
    if (!validateRegex(form.email)) return 'invalid';
    if (emailIsValid === true) return 'valid';
    // Check needsConfirmation BEFORE checking invalid - allows signup when service unavailable
    if (needsConfirmation) return 'warning';
    if (emailIsValid === false && emailReason !== 'validation_service_unavailable') return 'invalid';
    return null;
  };

  const emailStatus = getEmailStatus();

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

        {/* Email field with validation status */}
        <div className="relative">
          <input
            className={`w-full border p-3 rounded-lg bg-white dark:bg-matte pr-10 transition-colors ${emailStatus === 'invalid'
              ? 'border-red-400 dark:border-red-600'
              : emailStatus === 'valid'
                ? 'border-emerald-400 dark:border-emerald-600'
                : emailStatus === 'warning'
                  ? 'border-amber-400 dark:border-amber-600'
                  : 'border-gold/30'
              }`}
            placeholder="Email"
            type="email"
            name="email"
            autoComplete="new-email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            required
          />

          {/* Status indicator */}
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

        {/* Email validation feedback */}
        {emailTouched && form.email && (
          <>
            {!validateRegex(form.email) && (
              <p className="text-xs text-red-500 -mt-2">
                Please enter a valid email format.
              </p>
            )}
            {emailError && validateRegex(form.email) && (
              <p className={`text-xs -mt-2 ${needsConfirmation ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                {emailError}
              </p>
            )}
            {suggestion && (
              <p className="text-xs text-blue-600 dark:text-blue-400 -mt-2">
                Did you mean <button
                  type="button"
                  className="underline font-medium"
                  onClick={() => setForm({ ...form, email: suggestion })}
                >
                  {suggestion}
                </button>?
              </p>
            )}
          </>
        )}

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
          disabled={loading || emailIsValidating || (emailStatus === 'invalid' && !needsConfirmation)}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gold/20"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-matte px-3 text-neutral-500">or</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <a
          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google`}
          className="w-full flex items-center justify-center gap-3 border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte hover:bg-gold/5 dark:hover:bg-gold/10 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Continue with Google</span>
        </a>

        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Already a client? <Link to="/login" className="underline text-gold">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
