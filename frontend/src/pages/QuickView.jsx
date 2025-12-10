import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { getImageUrl } from '../utils/imageUrl.js';

const QuickView = () => {
  const { slug } = useParams();
  const addItem = useCart((s) => s.addItem);
  const { data: product } = useQuery({
    queryKey: ['quick', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data;
    },
  });

  if (!product) return null;

  return (
    <div className="lux-container py-12">
      <div className="lux-card p-6 grid gap-6 md:grid-cols-2">
        <img src={getImageUrl(product.images?.[0])} alt={product.title} className="w-full rounded-xl object-cover" />
        <div className="space-y-4">
          <p className="lux-badge">Preview</p>
          <p className="font-display text-2xl">{product.title}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: product.descriptionHTML }} />
          <button
            className="lux-btn-primary disabled:opacity-50"
            disabled={product.stock === 0}
            onClick={() => addItem(product, product.variants?.[0]?.id)}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickView;

