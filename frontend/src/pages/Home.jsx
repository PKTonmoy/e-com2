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
      <section
        className="relative overflow-hidden bg-matte text-white"
        style={{
          backgroundImage: hero.image ? `url(${hero.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay for text readability */}
        <div className={`absolute inset-0 ${hero.image ? 'bg-matte/70' : 'bg-matte'}`} />

        <div className="lux-container py-24 relative z-10">
          <div className="max-w-3xl space-y-4">
            {hero.badge && <p className="lux-badge">{hero.badge}</p>}
            <h1 className="lux-heading text-white text-4xl sm:text-5xl">
              {hero.title}
            </h1>
            <p className="text-lg text-neutral-200">
              {hero.subtitle}
            </p>
            <div className="flex space-x-3">
              {hero.buttonText && (
                <Link to={hero.buttonLink || '/shop'} className="lux-btn-primary">
                  {hero.buttonText}
                </Link>
              )}
              {hero.button2Text && (
                <Link
                  to={hero.button2Link || '/blog'}
                  className="lux-btn border border-gold/40 text-white hover:bg-gold/10 hover:text-gold"
                >
                  {hero.button2Text}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-matte via-transparent to-transparent z-[5]" />
      </section>

      {/* Limited Drops Section */}
      <section className="lux-container space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="lux-heading">{limited.title}</h2>
          <Link to={limited.buttonLink || '/shop'} className="text-sm uppercase tracking-[0.2em] hover:text-gold">
            {limited.buttonText}
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

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="lux-container space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="lux-heading">{blog.title}</h2>
              {blog.subtitle && (
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{blog.subtitle}</p>
              )}
            </div>
            <Link to={blog.buttonLink || '/blog'} className="text-sm uppercase tracking-[0.2em] hover:text-gold">
              {blog.buttonText}
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="lux-card overflow-hidden group"
              >
                {post.coverImage ? (
                  <div className="aspect-[16/10] overflow-hidden">
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
                  {post.category && <p className="lux-badge w-fit">{post.category}</p>}
                  <p className="font-display text-xl">{post.title}</p>
                  {post.excerpt && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">{post.excerpt}</p>
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
