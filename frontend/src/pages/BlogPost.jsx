import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';

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
    <div className="lux-container py-12 space-y-4">
      <p className="lux-badge">Journal</p>
      <h1 className="lux-heading">{post.title}</h1>
      <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.contentHTML }} />
    </div>
  );
};

export default BlogPost;

