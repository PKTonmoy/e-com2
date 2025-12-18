import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { getImageUrl } from '../utils/imageUrl.js';
import MobileHeader from '../components/MobileHeader';

const BlogPost = () => {
  const { slug } = useParams();
  const { data: post } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const res = await api.get(`/blog/${slug}`);
      return res.data;
    },
  });

  if (!post) return null;

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Mobile Back Header */}
      <div className="lg:hidden">
        <MobileHeader title="Editorial" subtitle="Back" showBack={true} />
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[70vh] w-full overflow-hidden bg-neutral-900">
        {post.coverImage ? (
          <img
            src={getImageUrl(post.coverImage)}
            alt={post.title}
            className="w-full h-full object-cover opacity-60 scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-matte to-neutral-800 opacity-80" />
        )}

        {/* Hero Overlay Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-black/40 via-transparent to-ivory/10 dark:to-matte/20">
          <div className="max-w-4xl space-y-6">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full border border-gold/40 bg-black/20 backdrop-blur-md text-gold text-[10px] uppercase tracking-[0.3em] font-medium shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                {post.category || 'Journal'}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-white drop-shadow-2xl leading-[1.1]">
              {post.title}
            </h1>

            <div className="flex items-center justify-center gap-4 text-ivory/60 text-xs uppercase tracking-widest font-body">
              <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold/40" />
              <span>5 min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <article className="lux-container py-12 sm:py-24 -mt-16 relative z-10">
        <div className="bg-white dark:bg-matte p-8 sm:p-20 rounded-3xl shadow-2xl shadow-black/5 border border-gold/10 max-w-4xl mx-auto">
          {/* Excerpt as intro */}
          {post.excerpt && (
            <div className="mb-12">
              <p className="font-display text-xl sm:text-2xl text-neutral-600 dark:text-neutral-300 italic leading-relaxed text-center">
                "{post.excerpt}"
              </p>
              <div className="w-16 h-0.5 bg-gold/30 mx-auto mt-8" />
            </div>
          )}

          {/* Main Body */}
          <div
            className="prose prose-lg sm:prose-xl max-w-none dark:prose-invert 
                       prose-headings:font-display prose-headings:font-normal prose-headings:text-matte dark:prose-headings:text-ivory
                       prose-p:font-body prose-p:font-light prose-p:text-neutral-600 dark:prose-p:text-neutral-400 prose-p:leading-relaxed
                       prose-strong:text-matte dark:prose-strong:text-ivory prose-strong:font-medium
                       prose-img:rounded-3xl prose-img:shadow-xl
                       selection:bg-gold selection:text-white"
            dangerouslySetInnerHTML={{ __html: post.contentHTML }}
          />

          {/* Footer of article */}
          <div className="mt-20 pt-10 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap gap-2">
              {post.tags?.map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wider text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button className="text-gold hover:text-white hover:bg-gold p-2 rounded-full border border-gold/30 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Suggested / Related Section Placeholder */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display text-2xl mb-12">More from Editorial</h2>
          {/* We could fetch more here but for now just a link back */}
          <Link to="/blog" className="lux-btn border border-gold/40 hover:bg-gold hover:text-white">
            Return to Editorial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;

