import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

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
      <div className="sm:hidden bg-ivory dark:bg-matte border-b border-gold/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <p className="text-gold text-[10px] font-medium uppercase tracking-widest">Stories</p>
            <h1 className="font-display text-lg text-matte dark:text-ivory leading-tight">Editorial</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="lux-container py-4 sm:py-12 space-y-6">
        <div className="hidden sm:flex items-center justify-between">
          <h1 className="lux-heading">Editorial</h1>
          <p className="text-sm text-neutral-600">Stories, ateliers, and the PRELUX gaze.</p>
        </div>

        {posts.length === 0 ? (
          <div className="lux-card p-8 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">No stories yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id} to={`/blog/${post.slug}`} className="lux-card p-4 sm:p-5 space-y-3 group hover:border-gold/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg sm:text-xl group-hover:text-gold transition-colors">{post.title}</p>
                  <svg className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{post.excerpt}</p>
                <span className="lux-badge w-fit text-xs">Read Story</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
