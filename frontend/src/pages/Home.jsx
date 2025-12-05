import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

const Home = () => {
  const { data: products = [] } = useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limitedEdition: true } });
      return res.data;
    },
  });

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden bg-matte text-white">
        <div className="lux-container py-24">
          <div className="max-w-3xl space-y-4">
            <p className="lux-badge">PRELUX Collection</p>
            <h1 className="lux-heading text-white text-4xl sm:text-5xl">
              Crafted for the few. Objects of quiet power.
            </h1>
            <p className="text-lg text-neutral-200">
              A curated house of watches, couture, interiors, and fragrance. Hand-finished, limited,
              and destined for discerning circles.
            </p>
            <div className="flex space-x-3">
              <Link to="/shop" className="lux-btn-primary">
                Discover the collection
              </Link>
              <Link
                to="/blog"
                className="lux-btn border border-gold/40 text-white hover:bg-gold/10 hover:text-gold"
              >
                Editorial stories
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-matte via-transparent to-transparent" />
      </section>

      <section className="lux-container space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="lux-heading">Limited Drops</h2>
          <Link to="/shop" className="text-sm uppercase tracking-[0.2em] hover:text-gold">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link
              key={product._id}
              to={`/product/${product.slug}`}
              className="lux-card overflow-hidden group"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={product.images?.[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4 space-y-2">
                <p className="lux-badge w-fit">Limited</p>
                <p className="font-display text-xl">{product.title}</p>
                <p className="text-sm text-neutral-600">
                  ${product.salePrice || product.price} • {product.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

