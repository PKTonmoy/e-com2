import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';

const DEFAULT_CONTENT = {
  title: 'The Collection',
  filterLabel: 'Filter & Sort',
};

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Shop = () => {
  const [category, setCategory] = useState('');
  const [limitedEdition, setLimitedEdition] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Debounce search query for API calls (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

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

  // Fetch filtered products with search
  const { data: products = [], isFetching } = useQuery({
    queryKey: ['products', category, limitedEdition, sort, debouncedSearch],
    queryFn: async () => {
      const params = {};
      if (category) params.category = category;
      if (limitedEdition) params.limitedEdition = limitedEdition;
      if (sort) params.sort = sort;
      if (debouncedSearch) params.q = debouncedSearch;
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
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const hasActiveFilters = category || limitedEdition || searchQuery;

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Sticky Search & Filters Container */}
      <div className="sticky top-0 z-30 bg-ivory dark:bg-matte border-b border-neutral-200 dark:border-neutral-800">
        <div className="lux-container">
          {/* Search Bar */}
          <div className="py-4">
            <div className={`relative transition-all duration-200 ${isSearchFocused ? 'transform scale-[1.01]' : ''}`}>
              <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${isSearchFocused ? 'text-gold' : 'text-neutral-400'}`} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full pl-12 pr-12 py-3 bg-white dark:bg-neutral-900 rounded-lg border transition-all duration-200 text-sm font-body text-matte dark:text-ivory placeholder:text-neutral-400 focus:outline-none ${isSearchFocused
                  ? 'border-gold shadow-lg shadow-gold/5'
                  : 'border-neutral-200 dark:border-neutral-700'
                  }`}
              />
              {/* Loading or Clear */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                {isFetching && searchQuery && (
                  <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                )}
                {searchQuery && !isFetching && (
                  <button onClick={clearSearch} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                    <XMarkIcon className="h-4 w-4 text-neutral-400 hover:text-gold" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="pb-4 flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs sm:text-sm font-body text-matte dark:text-ivory focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Limited Edition Filter */}
            <div className="relative">
              <SparklesIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold pointer-events-none" />
              <select
                value={limitedEdition}
                onChange={(e) => setLimitedEdition(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs sm:text-sm font-body text-matte dark:text-ivory focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="true">Limited Edition</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs sm:text-sm font-body text-matte dark:text-ivory focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="price">Price: Low → High</option>
                <option value="-price">Price: High → Low</option>
                <option value="title">Name: A → Z</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gold hover:bg-gold/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            {/* Results Count */}
            <div className="ml-auto">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-body">
                {isFetching ? 'Loading...' : `${products.length} items`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="lux-container py-6">
        {/* Page Title */}
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl sm:text-3xl text-matte dark:text-ivory">{content.title}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-body mt-1 text-sm">
            Discover our curated collection of luxury products
          </p>
          <div className="h-0.5 w-16 bg-gradient-to-r from-gold to-transparent mt-3" />
        </div>

        {/* Products */}
        {products.length === 0 && !isFetching ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <MagnifyingGlassIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-display text-xl text-neutral-700 dark:text-neutral-200">No products found</p>
              <p className="text-neutral-500 dark:text-neutral-400 font-body max-w-md text-sm px-4">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : 'Try adjusting your filters.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-matte dark:bg-ivory text-ivory dark:text-matte rounded-lg font-body text-sm hover:bg-gold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: List View */}
            <div className="sm:hidden space-y-3">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product.slug}`}
                  className="flex gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-3 hover:border-gold/30 transition-all hover-lift"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-2">
                        <h3 className="font-display text-sm leading-tight line-clamp-2 flex-1">
                          {product.title}
                        </h3>
                        {product.limitedEdition && (
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                            <SparklesIcon className="h-2.5 w-2.5" />
                            Ltd
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] uppercase tracking-wider text-neutral-400 mt-0.5">
                        {product.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-matte dark:text-ivory">
                          ${product.salePrice || product.price}
                        </span>
                        {product.salePrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            ${product.price}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                        {product.stock > 0 ? `${product.stock} left` : 'Sold out'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: Grid View */}
            <div className="hidden sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product.slug}`}
                  className="group bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-gold/30 hover:shadow-xl transition-all duration-300 hover-lift hover-gold-border"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    {product.limitedEdition && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded">
                        <SparklesIcon className="h-3 w-3" />
                        Limited
                      </span>
                    )}
                    <h3 className="font-display text-base leading-tight group-hover:text-gold transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-matte dark:text-ivory">
                        ${product.salePrice || product.price}
                      </span>
                      {product.salePrice && (
                        <span className="text-sm text-neutral-400 line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs uppercase tracking-wider text-neutral-400">
                        {product.category}
                      </span>
                      <span className={`text-xs ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Shop;
