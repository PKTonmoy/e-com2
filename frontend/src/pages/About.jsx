import MobileHeader from '../components/MobileHeader';

const About = () => {
  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <MobileHeader title="About PRELUX" subtitle="Maison" />

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
