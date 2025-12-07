import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

const DEFAULT_HERO = {
  badge: 'PRELUX Collection',
  title: 'Crafted for the few. Objects of quiet power.',
  subtitle: 'A curated house of watches, couture, interiors, and fragrance. Hand-finished, limited, and destined for discerning circles.',
  image: '',
  buttonText: 'Discover the collection',
  buttonLink: '/shop',
  button2Text: 'Editorial stories',
  button2Link: '/blog',
};

const DEFAULT_LIMITED = {
  title: 'Limited Drops',
  buttonText: 'View all',
  buttonLink: '/shop',
};

const DEFAULT_BLOG = {
  title: 'From the Editorial',
  subtitle: 'Stories, ateliers, and the PRELUX gaze.',
  buttonText: 'Read more',
  buttonLink: '/blog',
};

const Home = () => {
  // Fetch CMS content
  const { data: heroContent } = useQuery({
    queryKey: ['content', 'home.hero'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/home.hero');
        return res.data?.content || DEFAULT_HERO;
      } catch {
        return DEFAULT_HERO;
      }
    },
  });

  const { data: limitedContent } = useQuery({
    queryKey: ['content', 'home.limitedDrops'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/home.limitedDrops');
        return res.data?.content || DEFAULT_LIMITED;
      } catch {
        return DEFAULT_LIMITED;
      }
    },
  });

  const { data: blogContent } = useQuery({
    queryKey: ['content', 'home.blog'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/home.blog');
        return res.data?.content || DEFAULT_BLOG;
      } catch {
        return DEFAULT_BLOG;
      }
    },
  });

  // Fetch featured products
  const { data: products = [] } = useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limitedEdition: true } });
      return res.data;
    },
  });

  // Fetch blog posts
  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blog-home'],
    queryFn: async () => {
      const res = await api.get('/blog');
      return res.data;
    },
  });

  const hero = heroContent || DEFAULT_HERO;
  const limited = limitedContent || DEFAULT_LIMITED;
  const blog = blogContent || DEFAULT_BLOG;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center overflow-hidden bg-matte text-white">
        {/* Background Image */}
        {hero.image && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${hero.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 z-[1] ${hero.image ? 'bg-matte/60' : 'bg-matte'}`} />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-matte/80 via-matte/40 to-transparent" />

        {/* Content */}
        <div className="lux-container relative z-10 py-16 sm:py-24">
          <div className="max-w-2xl space-y-6">
            {hero.badge && (
              <span className="inline-block px-4 py-1.5 text-xs uppercase tracking-[0.2em] border border-gold/50 rounded-full text-gold">
                {hero.badge}
              </span>
            )}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-white">
              {hero.title}
            </h1>
            <p className="text-base sm:text-lg text-neutral-200 leading-relaxed max-w-xl">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {hero.buttonText && (
                <Link
                  to={hero.buttonLink || '/shop'}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gold text-matte font-medium text-sm rounded-lg hover:bg-gold/90 transition-colors"
                >
                  {hero.buttonText}
                </Link>
              )}
              {hero.button2Text && (
                <Link
                  to={hero.button2Link || '/blog'}
                  className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  {hero.button2Text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Limited Drops Section */}
      <section className="lux-container space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl sm:text-3xl text-matte dark:text-ivory">{limited.title}</h2>
          <Link to={limited.buttonLink || '/shop'} className="text-xs sm:text-sm uppercase tracking-[0.15em] text-neutral-600 dark:text-neutral-300 hover:text-gold transition-colors">
            {limited.buttonText}
          </Link>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link
              key={product._id}
              to={`/product/${product.slug}`}
              className="group bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-gold/30 transition-all"
            >
              <div className="aspect-[4/5] overflow-hidden bg-neutral-50 dark:bg-neutral-800">
                <img
                  src={product.images?.[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4 space-y-2">
                <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider border border-gold/40 text-gold rounded">
                  Limited
                </span>
                <h3 className="font-display text-lg leading-tight">{product.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  ${product.salePrice || product.price} • {product.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="lux-container space-y-8 pb-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-matte dark:text-ivory">{blog.title}</h2>
              {blog.subtitle && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{blog.subtitle}</p>
              )}
            </div>
            <Link to={blog.buttonLink || '/blog'} className="text-xs sm:text-sm uppercase tracking-[0.15em] text-neutral-600 dark:text-neutral-300 hover:text-gold transition-colors">
              {blog.buttonText}
            </Link>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="group bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-gold/30 transition-all"
              >
                {post.coverImage ? (
                  <div className="aspect-[16/10] overflow-hidden bg-neutral-50 dark:bg-neutral-800">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-gold/20 to-matte/30 flex items-center justify-center">
                    <span className="text-4xl font-display text-gold/50">{post.title.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  {post.category && (
                    <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider border border-gold/40 text-gold rounded">
                      {post.category}
                    </span>
                  )}
                  <h3 className="font-display text-lg leading-tight">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
