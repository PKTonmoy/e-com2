const About = () => {
  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <div className="sm:hidden bg-ivory dark:bg-matte border-b border-gold/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-gold text-[10px] font-medium uppercase tracking-widest">Maison</p>
            <h1 className="font-display text-lg text-matte dark:text-ivory leading-tight">About PRELUX</h1>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block lux-container py-12 space-y-4">
        <p className="lux-badge">Maison</p>
        <h1 className="lux-heading">About PRELUX</h1>
      </div>

      {/* Content */}
      <div className="lux-container py-6 sm:py-0">
        <p className="text-lg text-neutral-700 dark:text-neutral-200">
          PRELUX curates rarefied objects with obsessive craftsmanship. From ateliers in Paris to
          family-run workshops in Kyoto, each piece is produced in limited runs and presented with
          reverence.
        </p>
      </div>
    </div>
  );
};

export default About;
