import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';

const Search = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { data: products = [] } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const res = await api.get('/products', { params: { q } });
      return res.data.products || [];
    },
  });

  return (
    <div className="lux-container py-12 space-y-4">
      <h1 className="lux-heading">Search</h1>
      <p className="text-sm text-neutral-600">Results for “{q}”</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link key={p._id} to={`/product/${p.slug}`} className="lux-card p-4 space-y-2">
            <p className="font-display">{p.title}</p>
            <p className="text-sm text-neutral-600">৳{p.salePrice || p.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Search;

