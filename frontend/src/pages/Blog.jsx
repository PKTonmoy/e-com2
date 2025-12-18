import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import MobileHeader from '../components/MobileHeader';
import { getImageUrl } from '../utils/imageUrl.js';
import { PhotoIcon } from '@heroicons/react/24/outline';

const Blog = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ['blog'],
    queryFn: async () => {
      const res = await api.get('/blog');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <MobileHeader title="Editorial" subtitle="Stories" />

      {/* Content */}
      <div className="lux-container py-4 sm:py-12 space-y-8">
        <div className="hidden sm:flex items-center justify-between border-b border-gold/20 pb-6">
          <div>
            <h1 className="lux-heading">Editorial</h1>
            <p className="text-sm text-neutral-600 mt-1">Stories, ateliers, and the PRELUX gaze.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-medium">Inside Prelux</span>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="lux-card p-12 text-center border-dashed border-gold/30">
            <PhotoIcon className="w-12 h-12 mx-auto text-gold/30 mb-4" />
            <p className="text-sm text-neutral-600 dark:text-neutral-300">No stories yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id} to={`/blog/${post.slug}`} className="lux-card flex flex-col group hover:border-gold/40 transition-all duration-500 overflow-hidden bg-white/50 dark:bg-matte/50 backdrop-blur-sm shadow-xl shadow-black/5 hover:-translate-y-1">
                {/* Thumbnail */}
                <div className="aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative">
                  {post.coverImage ? (
                    <img
                      src={getImageUrl(post.coverImage)}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-ivory/50">
                      <PhotoIcon className="w-8 h-8 text-neutral-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-gold font-medium">
                        {post.category || 'Journal'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gold/30" />
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="font-display text-xl leading-tight group-hover:text-gold transition-colors duration-300">{post.title}</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 font-body font-light leading-relaxed">{post.excerpt}</p>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium group-hover:text-gold transition-colors">Read Story</span>
                    <svg className="w-4 h-4 text-gold transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
