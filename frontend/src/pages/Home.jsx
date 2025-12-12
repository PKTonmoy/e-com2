import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SparklesIcon, TruckIcon, ShieldCheckIcon, CurrencyDollarIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import { getImageUrl } from '../utils/imageUrl.js';

const DEFAULT_HERO = {
  promoBanner: {
    text: 'EXTRA 20% OFF ON SELECTED ITEMS',
    code: 'HH2D',
    enabled: true
  },
  title: 'FASHION',
  subtitle: 'FOR EVERY MOMENT',
  description: 'Explore fashion-forward clothing, shoes, and accessories. Curated collections for every season and occasion.',
  buttonText: 'EXPLORE MORE',
  buttonLink: '/shop',
  heroImages: [
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', alt: 'Fashion model 1' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', alt: 'Fashion model 2' },
    { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', alt: 'Fashion model 3' },
    { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600', alt: 'Fashion couple' },
  ],
  trustBadges: [
    { icon: 'flag', label: 'Authentic Italian', sublabel: 'Brands' },
    { icon: 'currency', label: 'Exclusive Pricing', sublabel: '' },
    { icon: 'shield', label: 'Secure Payments &', sublabel: 'Fast Shipping' },
    { icon: 'truck', label: '21k+ Products', sublabel: 'Delivered' },
  ]
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

// Trust badge icon mapping
const TrustBadgeIcon = ({ icon }) => {
  switch (icon) {
    case 'flag':
      return (
        <div className="w-10 h-10 flex items-center justify-center">
          <span className="text-2xl">🇮🇹</span>
        </div>
      );
    case 'currency':
      return <span className="text-3xl font-bold text-gold">৳</span>;
    case 'shield':
      return <ShieldCheckIcon className="w-8 h-8 text-gold" />;
    case 'truck':
      return <TruckIcon className="w-8 h-8 text-gold" />;
    default:
      return <CheckBadgeIcon className="w-8 h-8 text-gold" />;
  }
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

  const hero = { ...DEFAULT_HERO, ...heroContent };
  const limited = { ...DEFAULT_LIMITED, ...limitedContent };
  const blog = { ...DEFAULT_BLOG, ...blogContent };

  // Get hero images with fallbacks
  const heroImages = hero.heroImages?.length >= 4 ? hero.heroImages : DEFAULT_HERO.heroImages;
  const trustBadges = hero.trustBadges?.length ? hero.trustBadges : DEFAULT_HERO.trustBadges;

  return (
    <div>
      {/* Promo Banner */}
      {hero.promoBanner?.enabled && (
        <div className="bg-matte text-ivory text-center py-2.5 text-xs tracking-widest uppercase">
          {hero.promoBanner.text}
          {hero.promoBanner.code && (
            <span> - USE THE CODE <span className="text-gold font-semibold">{hero.promoBanner.code}</span></span>
          )}
        </div>
      )}

      {/* Hero Section - Fashion Grid Layout */}
      <section className="bg-ivory dark:bg-matte py-8 lg:py-12">
        <div className="lux-container">
          <div className="grid grid-cols-12 gap-4 lg:gap-6 items-center">

            {/* Left Image - Large */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200">
                <img
                  src={heroImages[0]?.url}
                  alt={heroImages[0]?.alt || 'Fashion image 1'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Center Content + Images */}
            <div className="col-span-12 md:col-span-8 lg:col-span-6 space-y-6">
              {/* Top Right Small Image */}
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-4">
                  {/* Main Title */}
                  <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-[#8B7355] dark:text-gold leading-none tracking-tight">
                    {hero.title}
                  </h1>

                  {/* Subtitle */}
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-matte dark:text-ivory tracking-wide">
                    {hero.subtitle}
                  </h2>

                  {/* Description */}
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md leading-relaxed">
                    {hero.description}
                  </p>

                  {/* CTA Button */}
                  <Link
                    to={hero.buttonLink || '/shop'}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#8B7355] dark:bg-gold text-white dark:text-matte font-semibold text-sm uppercase tracking-widest rounded-full hover:bg-matte dark:hover:bg-white transition-all duration-300 group"
                  >
                    {hero.buttonText}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Small Image Top Right */}
                <div className="hidden lg:block w-36 aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200">
                  <img
                    src={heroImages[1]?.url}
                    alt={heroImages[1]?.alt || 'Fashion image 2'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Bottom Center Image */}
              <div className="flex justify-center">
                <div className="w-48 lg:w-56 aspect-[4/5] overflow-hidden rounded-lg bg-neutral-200">
                  <img
                    src={heroImages[2]?.url}
                    alt={heroImages[2]?.alt || 'Fashion image 3'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Right Image - Large */}
            <div className="col-span-12 md:col-span-12 lg:col-span-3">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200">
                <img
                  src={heroImages[3]?.url}
                  alt={heroImages[3]?.alt || 'Fashion image 4'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-neutral-100 dark:bg-neutral-900 py-6 border-y border-neutral-200 dark:border-neutral-800">
        <div className="lux-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3">
                <TrustBadgeIcon icon={badge.icon} />
                <div>
                  <p className="font-semibold text-sm text-matte dark:text-ivory">{badge.label}</p>
                  {badge.sublabel && (
                    <p className="text-xs text-neutral-500">{badge.sublabel}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limited Drops Section */}
      <section className="lux-container py-12 sm:py-20 space-y-8 sm:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-matte dark:text-ivory">{limited.title}</h2>
            <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
          </div>
          <Link
            to={limited.buttonLink || '/shop'}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold sm:text-neutral-500 hover:text-gold transition-colors duration-300 font-medium"
          >
            {limited.buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
                  src={getImageUrl(product.images?.[0])}
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
                  <span className="text-lg font-semibold text-matte dark:text-ivory">৳{product.salePrice || product.price}</span>
                  <span className="text-sm text-neutral-400">• {product.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="bg-neutral-50 dark:bg-neutral-900/50 py-12 sm:py-20">
          <div className="lux-container space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-matte dark:text-ivory">{blog.title}</h2>
                {blog.subtitle && (
                  <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm sm:text-base">{blog.subtitle}</p>
                )}
                <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
              </div>
              <Link
                to={blog.buttonLink || '/blog'}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold sm:text-neutral-500 hover:text-gold transition-colors duration-300 font-medium"
              >
                {blog.buttonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
                        src={getImageUrl(post.coverImage)}
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

      {/* Shop Now CTA Section */}
      <section className="bg-gradient-to-br from-matte via-neutral-900 to-matte py-16 sm:py-24">
        <div className="lux-container text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-ivory">
            Ready to Elevate Your Style?
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            Discover our curated collection of premium fashion pieces crafted for the discerning individual.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 bg-gold text-matte font-semibold text-sm uppercase tracking-widest rounded-full hover:bg-white transition-all duration-300 group shadow-lg shadow-gold/20"
          >
            Shop Now
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
