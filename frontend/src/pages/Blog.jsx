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
    <div className="lux-container py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="lux-heading">Editorial</h1>
        <p className="text-sm text-neutral-600">Stories, ateliers, and the PRELUX gaze.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post._id} to={`/blog/${post.slug}`} className="lux-card p-4 space-y-2">
            <p className="font-display text-xl">{post.title}</p>
            <p className="text-sm text-neutral-600">{post.excerpt}</p>
            <span className="lux-badge w-fit">Read</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Blog;

