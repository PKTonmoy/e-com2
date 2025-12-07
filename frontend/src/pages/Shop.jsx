import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FunnelIcon, SparklesIcon, ArrowsUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';

const DEFAULT_CONTENT = {
  title: 'The Collection',
  filterLabel: 'Filter & Sort',
};

const Shop = () => {
  const [category, setCategory] = useState('');
  const [limitedEdition, setLimitedEdition] = useState('');
  const [sort, setSort] = useState('-createdAt');

  // Fetch CMS content
  const { data: cmsContent } = useQuery({
    queryKey: ['content', 'shop.header'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/shop.header');
        return res.data?.content || DEFAULT_CONTENT;
      } catch {
        return DEFAULT_CONTENT;
      }
    },
  });

  const content = cmsContent || DEFAULT_CONTENT;

  // Fetch all products to get complete category list
  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  // Fetch filtered products
  const { data: products = [] } = useQuery({
    queryKey: ['products', category, limitedEdition, sort],
    queryFn: async () => {
      const params = {};
      if (category) params.category = category;
      if (limitedEdition) params.limitedEdition = limitedEdition;
      if (sort) params.sort = sort;
      const res = await api.get('/products', { params });
      return res.data;
    },
  });

  // Extract all categories from allProducts instead of filtered products
  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];

  const clearFilters = () => {
    setCategory('');
    setLimitedEdition('');
    setSort('-createdAt');
  };

  return (
    <div className="lux-container py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="lux-heading">{content.title}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 font-body">{products.length} items</p>
      </div>

      {/* Filters */}
      <div className="lux-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-5 w-5 text-gold" />
          <p className="font-semibold text-sm font-body">{content.filterLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-ivory/30 dark:bg-matte/30 text-matte dark:text-ivory font-body focus:outline-none focus:ring-0 transition hover:border-gold/50 backdrop-blur-md appearance-none"
            style={{
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option value="" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-ivory dark:bg-matte text-matte dark:text-ivory">
                {cat}
              </option>
            ))}
          </select>

          <div className="relative">
            <SparklesIcon className="h-4 w-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={limitedEdition}
              onChange={(e) => setLimitedEdition(e.target.value)}
              className="border border-gold/30 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-white/10 dark:bg-matte/10 text-matte dark:text-ivory font-body focus:outline-none focus:ring-0 transition hover:border-gold/50 backdrop-blur-md appearance-none"
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <option value="" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">All Products</option>
              <option value="true" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Limited Edition Only</option>
            </select>
          </div>

          <div className="relative">
            <ArrowsUpDownIcon className="h-4 w-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gold/30 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-white/10 dark:bg-matte/10 text-matte dark:text-ivory font-body focus:outline-none focus:ring-0 transition hover:border-gold/50 backdrop-blur-md appearance-none"
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <option value="-createdAt" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Newest First</option>
              <option value="createdAt" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Oldest First</option>
              <option value="price" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Price: Low to High</option>
              <option value="-price" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Price: High to Low</option>
              <option value="title" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Name: A-Z</option>
              <option value="-title" className="bg-ivory dark:bg-matte text-matte dark:text-ivory">Name: Z-A</option>
            </select>
          </div>

          {(category || limitedEdition) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-gold hover:text-amber-600 dark:hover:text-amber-400 font-body transition"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link key={product._id} to={`/product/${product.slug}`} className="lux-card overflow-hidden group">
            <div className="aspect-[4/5]">
              <img
                src={product.images?.[0]}
                alt={product.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4 space-y-2">
              {product.limitedEdition && <span className="lux-badge">Limited</span>}
              <p className="font-display text-xl">{product.title}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 font-body">
                ${product.salePrice || product.price}{' '}
                {product.salePrice && <span className="line-through text-xs">${product.price}</span>}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-body">{product.category}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-200 font-body">
                {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Shop;


