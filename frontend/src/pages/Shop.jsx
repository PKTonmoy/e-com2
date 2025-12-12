import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, PlusIcon, HeartIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { useToast } from '../components/ToastProvider.jsx';
import { useBottomNav } from '../context/BottomNavContext.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

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

// Collapsible Filter Section Component
const FilterSection = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-neutral-200 dark:border-neutral-800">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left"
    >
      <span className="font-medium text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400">{title}</span>
      <ChevronDownIcon className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
      {children}
    </div>
  </div>
);

const Shop = () => {
  const [category, setCategory] = useState('');
  const [limitedEdition, setLimitedEdition] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [addedProducts, setAddedProducts] = useState({});

  // Cart and Toast
  const addItem = useCart((s) => s.addItem);
  const { addToast } = useToast();
  const { hideBottomNav, showBottomNav } = useBottomNav();

  // Desktop filter dropdowns state
  const [openFilters, setOpenFilters] = useState({
    sort: true,
    category: true,
    type: false
  });

  const toggleFilter = (filter) => {
    setOpenFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  // Handle add to cart
  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    const result = addItem(product, product.variants?.[0]?.id, product.stock, null);
    if (result.success) {
      addToast(`${product.title} added to cart!`);
      setAddedProducts(prev => ({ ...prev, [product._id]: true }));
      setTimeout(() => {
        setAddedProducts(prev => ({ ...prev, [product._id]: false }));
      }, 2000);
    } else {
      addToast(result.message || 'Could not add to cart');
    }
  };

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

  // Prevent body scroll when filter modal is open (mobile only)
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterOpen]);

  // Hide/show bottom nav when filter modal is open
  useEffect(() => {
    if (isFilterOpen) {
      hideBottomNav();
    } else {
      showBottomNav();
    }
  }, [isFilterOpen, hideBottomNav, showBottomNav]);

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="lg:hidden">
        {/* Compact Mobile Header */}
        <div className="sm:hidden bg-ivory dark:bg-matte border-b border-gold/20 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <p className="text-gold text-[10px] font-medium uppercase tracking-widest">Collection</p>
              <div className="flex items-baseline gap-2">
                <h1 className="font-display text-lg text-matte dark:text-ivory leading-tight">{content.title}</h1>
                {products.length > 0 && <span className="text-xs text-neutral-400">({products.length})</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search & Filter */}
        <div className="bg-ivory dark:bg-matte px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className={`relative flex-1 transition-all duration-200 ${isSearchFocused ? 'transform scale-[1.01]' : ''}`}>
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-neutral-900 rounded-xl border-0 text-sm font-body text-matte dark:text-ivory placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-gold/30 shadow-sm"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  <XMarkIcon className="h-4 w-4 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-sm ${hasActiveFilters ? 'ring-2 ring-gold' : ''}`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-matte dark:text-ivory" />
            </button>
          </div>
        </div>

        {/* Mobile Products Grid */}
        <div className="px-4 pb-6">
          {products.length === 0 && !isFetching ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center">
                <MagnifyingGlassIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-display text-xl text-neutral-700 dark:text-neutral-200">No products found</p>
                <p className="text-neutral-500 dark:text-neutral-400 font-body max-w-md text-sm px-4">
                  {searchQuery ? `No results for "${searchQuery}".` : 'Try adjusting your filters.'}
                </p>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-5 py-2.5 bg-matte text-ivory rounded-xl font-body text-sm">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product.slug}`}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-800 relative">
                    <img src={getImageUrl(product.images?.[0])} alt={product.title} className="w-full h-full object-cover" />
                    {product.limitedEdition && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 text-[10px] font-body font-medium text-gold bg-gold/10 backdrop-blur-sm px-2 py-1 rounded-full">
                        <SparklesIcon className="h-3 w-3" />
                        Limited
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h3 className="font-display text-sm leading-tight line-clamp-1">{product.title}</h3>
                    <p className="text-[11px] font-body text-neutral-400 line-clamp-1">{product.category}</p>
                    <div className="flex items-end justify-between pt-1">
                      <div className="flex flex-col">
                        {product.salePrice && <span className="text-[10px] font-body text-neutral-400 line-through">৳ {product.price}</span>}
                        <span className="font-body font-semibold text-matte dark:text-ivory leading-none"><span className="text-sm">৳</span> {product.salePrice || product.price}</span>
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stock <= 0}
                        className={`p-1.5 rounded-full transition-colors ${addedProducts[product._id]
                          ? 'bg-emerald-500 text-white'
                          : product.stock <= 0
                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-gold hover:text-white'
                          }`}
                      >
                        {addedProducts[product._id] ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden lg:block">
        {/* Desktop Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-matte">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl text-matte dark:text-ivory">{content.title}</h1>
                <p className="text-neutral-500 font-body text-sm mt-1">{products.length} products</p>
              </div>

              {/* Desktop Search */}
              <div className="relative w-80">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-body focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content with Sidebar */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">

            {/* Desktop Sidebar Filters - Sticky with Dropdowns */}
            <aside className="w-60 flex-shrink-0">
              <div className="sticky top-24 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                  <h2 className="font-display text-lg">Filters</h2>
                </div>

                <div className="px-4">
                  {/* Sort Dropdown */}
                  <FilterSection title="Sort By" isOpen={openFilters.sort} onToggle={() => toggleFilter('sort')}>
                    <div className="space-y-1">
                      {[
                        { value: '-createdAt', label: 'Newest First' },
                        { value: 'price', label: 'Price: Low to High' },
                        { value: '-price', label: 'Price: High to Low' },
                        { value: 'title', label: 'Alphabetical' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSort(option.value)}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${sort === option.value
                            ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte font-medium'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Category Dropdown */}
                  <FilterSection title="Category" isOpen={openFilters.category} onToggle={() => toggleFilter('category')}>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => setCategory('')}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${category === '' ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                      >
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${category === cat ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Type Dropdown */}
                  <FilterSection title="Type" isOpen={openFilters.type} onToggle={() => toggleFilter('type')}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setLimitedEdition('')}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${limitedEdition === '' ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                      >
                        All Types
                      </button>
                      <button
                        onClick={() => setLimitedEdition('true')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors flex items-center gap-2 ${limitedEdition === 'true' ? 'bg-gold text-white font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Limited Edition
                      </button>
                    </div>
                  </FilterSection>
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      onClick={clearFilters}
                      className="w-full py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-body font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Desktop Products Grid */}
            <div className="flex-1">
              {products.length === 0 && !isFetching ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <MagnifyingGlassIcon className="h-12 w-12 text-neutral-300" />
                  <p className="font-display text-xl text-neutral-600">No products found</p>
                  <p className="text-neutral-400 font-body text-sm">Try adjusting your filters or search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug}`}
                      className="group bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:shadow-xl hover:border-gold/30 transition-all duration-300"
                    >
                      {/* Product Image */}
                      <div className="aspect-[4/5] overflow-hidden bg-neutral-50 dark:bg-neutral-800 relative">
                        <img
                          src={getImageUrl(product.images?.[0])}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Limited Badge */}
                        {product.limitedEdition && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-body font-medium text-gold bg-white/90 dark:bg-matte/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                            <SparklesIcon className="h-3.5 w-3.5" />
                            Limited
                          </span>
                        )}

                        {/* Quick Actions */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => e.preventDefault()}
                            className="p-2 bg-white dark:bg-matte rounded-full shadow-lg hover:bg-gold hover:text-white transition-colors"
                          >
                            <HeartIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-2">
                        <p className="text-xs font-body uppercase tracking-wider text-neutral-400">{product.category}</p>
                        <h3 className="font-display text-base leading-tight group-hover:text-gold transition-colors line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-end justify-between pt-2">
                          <div className="flex flex-col">
                            {product.salePrice && (
                              <span className="text-xs font-body text-neutral-400 line-through">৳ {product.price}</span>
                            )}
                            <span className="font-body font-semibold text-lg text-matte dark:text-ivory leading-none">
                              <span className="text-lg">৳</span> {product.salePrice || product.price}
                            </span>
                          </div>
                          <span className={`text-xs font-body ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== MOBILE FILTER MODAL ========== */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
        <div className={`absolute bottom-0 left-0 right-0 bg-ivory dark:bg-neutral-900 rounded-t-3xl transform transition-transform duration-300 ${isFilterOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          </div>
          <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto">
            {/* Sort By */}
            <div className="mb-6">
              <h3 className="font-display text-lg mb-3 text-matte dark:text-ivory">Sort By</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '-createdAt', label: 'Newest' },
                  { value: 'price', label: 'Price ↑' },
                  { value: '-price', label: 'Price ↓' },
                  { value: 'title', label: 'A-Z' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSort(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${sort === option.value ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte' : 'bg-white dark:bg-neutral-800'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-display text-lg mb-3 text-matte dark:text-ivory">Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategory('')}
                  className={`px-4 py-2 rounded-full text-sm font-body font-medium ${category === '' ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte' : 'bg-white dark:bg-neutral-800'}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-body font-medium ${category === cat ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte' : 'bg-white dark:bg-neutral-800'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="mb-6">
              <h3 className="font-display text-lg mb-3 text-matte dark:text-ivory">Type</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLimitedEdition('')}
                  className={`px-4 py-2 rounded-full text-sm font-body font-medium ${limitedEdition === '' ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte' : 'bg-white dark:bg-neutral-800'}`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setLimitedEdition('true')}
                  className={`px-4 py-2 rounded-full text-sm font-body font-medium flex items-center gap-1 ${limitedEdition === 'true' ? 'bg-gold text-white' : 'bg-white dark:bg-neutral-800'}`}
                >
                  <SparklesIcon className="h-4 w-4" />
                  Limited Edition
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => { clearFilters(); setIsFilterOpen(false); }}
                className="flex-1 py-3.5 bg-white dark:bg-neutral-800 rounded-xl font-body font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3.5 bg-matte dark:bg-ivory text-ivory dark:text-matte rounded-xl font-body font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
