const FAQ = () => {
  const items = [
    { q: 'Shipping', a: 'Complimentary express shipping worldwide.', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
    { q: 'Returns', a: 'Returns accepted within 30 days; curated exceptions apply.', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { q: 'Limited editions', a: 'Numbered pieces include certificate of authenticity.', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  ];

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <div className="sm:hidden bg-ivory dark:bg-matte border-b border-gold/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gold text-[10px] font-medium uppercase tracking-widest">Support</p>
            <h1 className="font-display text-lg text-matte dark:text-ivory leading-tight">FAQ</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="lux-container py-6 sm:py-12 space-y-4">
        <h1 className="lux-heading hidden sm:block">FAQ</h1>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.q} className="lux-card p-4 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <div>
                <p className="font-semibold">{item.q}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
