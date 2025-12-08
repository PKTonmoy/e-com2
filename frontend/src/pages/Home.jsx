import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
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
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-[#0a0a0a]">

        {/* Background Image Logic */}
        {hero.image ? (
          <>
            {/* User Uploaded Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={hero.image}
                alt="Hero background"
                className="w-full h-full object-cover opacity-50"
              />
              {/* Dark Overlay for Text Visibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            </div>
          </>
        ) : (
          <>
            {/* Fallback Luxury Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.15),transparent)]" />
            <div className="absolute top-20 right-10 w-32 h-32 border border-gold/10 rounded-full opacity-30" />
            <div className="absolute bottom-32 right-1/4 w-20 h-20 border border-gold/20 rounded-full opacity-20" />
            <div className="absolute top-1/3 right-20 w-2 h-2 bg-gold/40 rounded-full" />
            <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-gold/30 rounded-full" />
          </>
        )}

        {/* Content - ALWAYS VISIBLE (z-10 ensures it's above image/overlay) */}
        <div className="relative z-10 lux-container py-20">
          <div className="max-w-3xl space-y-8">
            {/* Badge */}
            {hero.badge && (
              <div>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold/10 border border-gold/30 rounded-full backdrop-blur-sm">
                  <SparklesIcon className="h-4 w-4 text-gold" />
                  <span className="text-xs uppercase tracking-[0.3em] text-gold font-medium">
                    {hero.badge}
                  </span>
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-white drop-shadow-lg">
              {hero.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-neutral-200 leading-relaxed max-w-2xl drop-shadow-md">
              {hero.subtitle}
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              {hero.buttonText && (
                <Link
                  to={hero.buttonLink || '/shop'}
                  className="inline-flex items-center justify-center px-10 py-5 bg-gold text-[#0a0a0a] font-bold text-sm uppercase tracking-widest rounded-full hover:bg-white transition-all duration-500 shadow-lg shadow-gold/20"
                >
                  {hero.buttonText}
                </Link>
              )}
              {hero.button2Text && (
                <Link
                  to={hero.button2Link || '/blog'}
                  className="inline-flex items-center justify-center px-10 py-5 border-2 border-white/30 text-white font-medium text-sm uppercase tracking-widest rounded-full hover:border-gold hover:text-gold transition-all duration-500 backdrop-blur-sm"
                >
                  {hero.button2Text}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ivory dark:from-matte to-transparent pointer-events-none" />
      </section>

      {/* Limited Drops Section */}
      <section className="lux-container py-20 space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-matte dark:text-ivory">{limited.title}</h2>
            <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
          </div>
          <Link
            to={limited.buttonLink || '/shop'}
            className="text-sm uppercase tracking-[0.2em] text-neutral-500 hover:text-gold transition-colors duration-300"
          >
            {limited.buttonText}
          </Link>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link
              key={product._id}
              to={`/product/${product.slug}`}
              className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-gold/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="aspect-[4/5] overflow-hidden bg-neutral-50 dark:bg-neutral-800">
                <img
                  src={product.images?.[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-widest bg-gold/10 text-gold rounded-full">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Limited Edition
                </span>
                <h3 className="font-display text-xl leading-tight group-hover:text-gold transition-colors duration-300">{product.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-matte dark:text-ivory">${product.salePrice || product.price}</span>
                  <span className="text-sm text-neutral-400">• {product.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="bg-neutral-50 dark:bg-neutral-900/50 py-20">
          <div className="lux-container space-y-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl text-matte dark:text-ivory">{blog.title}</h2>
                {blog.subtitle && (
                  <p className="text-neutral-500 dark:text-neutral-400 mt-2">{blog.subtitle}</p>
                )}
                <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
              </div>
              <Link
                to={blog.buttonLink || '/blog'}
                className="text-sm uppercase tracking-[0.2em] text-neutral-500 hover:text-gold transition-colors duration-300"
              >
                {blog.buttonText}
              </Link>
            </div>

            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.slice(0, 3).map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-gold/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  {post.coverImage ? (
                    <div className="aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-gold/20 via-neutral-100 to-neutral-200 dark:from-gold/10 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                      <span className="text-5xl font-display text-gold/30">{post.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    {post.category && (
                      <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-widest bg-gold/10 text-gold rounded-full">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-display text-xl leading-tight group-hover:text-gold transition-colors duration-300">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom Spacer */}
      <div className="h-16" />
    </div>
  );
};

export default Home;
