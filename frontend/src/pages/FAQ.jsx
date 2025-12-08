const FAQ = () => {
  const items = [
    { q: 'Shipping', a: 'Complimentary express shipping worldwide.' },
    { q: 'Returns', a: 'Returns accepted within 30 days; curated exceptions apply.' },
    { q: 'Limited editions', a: 'Numbered pieces include certificate of authenticity.' },
  ];

  return (
    <div className="lux-container py-12 space-y-4">
      <h1 className="lux-heading">FAQ</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.q} className="lux-card p-4">
            <p className="font-semibold">{item.q}</p>
            <p className="text-sm text-neutral-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;

