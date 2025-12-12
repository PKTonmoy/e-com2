import MobileHeader from '../components/MobileHeader';

const Contact = () => {
  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <MobileHeader title="Contact Us" subtitle="Concierge" />

      {/* Content */}
      <div className="lux-container py-6 sm:py-12 grid gap-6 md:grid-cols-2">
        <div className="space-y-3 hidden sm:block">
          <p className="lux-badge">Concierge</p>
          <h1 className="lux-heading">Contact Us</h1>
          <p className="text-sm text-neutral-600">
            Maison hotline: +33 1 23 45 67 89 • concierge@prelux.lux
          </p>
          <p className="text-sm text-neutral-600">Flagship: 10 Avenue Montaigne, Paris.</p>
        </div>

        {/* Mobile Contact Info */}
        <div className="sm:hidden space-y-3 mb-4">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gold/20">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Hotline</p>
              <p className="text-sm font-medium">+33 1 23 45 67 89</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gold/20">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Flagship</p>
              <p className="text-sm font-medium">10 Avenue Montaigne, Paris</p>
            </div>
          </div>
        </div>

        <form className="lux-card p-4 space-y-3">
          <input className="border border-gold/20 dark:border-neutral-700 bg-transparent p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Name" />
          <input className="border border-gold/20 dark:border-neutral-700 bg-transparent p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Email" />
          <textarea className="border border-gold/20 dark:border-neutral-700 bg-transparent p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gold/30" placeholder="Your request" rows="4" />
          <button className="lux-btn-primary w-full sm:w-auto">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
