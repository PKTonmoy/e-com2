import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, PlusIcon, HeartIcon, ChevronDownIcon, CheckIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { useToast } from '../components/ToastProvider.jsx';
import { useBottomNav } from '../context/BottomNavContext.jsx';
import { getImageUrl } from '../utils/imageUrl.js';
import MobileHeader from '../components/MobileHeader';
import ProductSelectionModal from '../components/ProductSelectionModal.jsx';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton.jsx';
import MobileProductCard from '../components/MobileProductCard.jsx';
import DesktopProductCard from '../components/DesktopProductCard.jsx';

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
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectionMode, setSelectionMode] = useState('checkout');
  const navigate = useNavigate();
  const setItems = useCart((s) => s.setItems);

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
    setActiveProduct(product);
    setSelectionMode('cart');
    setIsBuyNowOpen(true);
  };

  const handleBuyNowClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveProduct(product);
    setSelectionMode('checkout');
    setIsBuyNowOpen(true);
  };

  const onConfirmSelection = (data) => {
    if (!activeProduct) return;

    if (data.mode === 'cart') {
      const result = addItem(activeProduct, activeProduct.variants?.[0]?.id, activeProduct.stock, data.size);
      if (result.success) {
        setIsBuyNowOpen(false);
        addToast(`${activeProduct.title} has been added to your bag!`, {
          image: getImageUrl(activeProduct.images?.[0]),
          actionLabel: 'View your Bag',
          actionLink: '/cart'
        });
        setAddedProducts(prev => ({ ...prev, [activeProduct._id]: true }));
        setTimeout(() => {
          setAddedProducts(prev => ({ ...prev, [activeProduct._id]: false }));
        }, 2000);
      } else {
        addToast(result.message || 'Could not add to bag');
      }
      return;
    }

    // Default to checkout mode
    const newItem = {
      productId: activeProduct._id,
      variantId: activeProduct.variants?.[0]?.id,
      qty: data.quantity,
      price: activeProduct.salePrice || activeProduct.price,
      title: activeProduct.title,
      sku: activeProduct.sku,
      stock: activeProduct.stock,
      selectedSize: data.size,
      image: getImageUrl(activeProduct.images?.[0]),
    };
    setItems([newItem]);
    navigate('/checkout');
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
        <MobileHeader
          title={content.title}
          subtitle="Collection"
        />

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
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-24 px-2">
              {products.map((product) => (
                <MobileProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNowClick}
                  isAddedToCart={!!addedProducts[product._id]}
                />
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
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                  {products.map((product) => (
                    <DesktopProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNowClick}
                      isAddedToCart={!!addedProducts[product._id]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== MOBILE FILTER MODAL ========== */}
      <div data-modal-overlay className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
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

      {/* Selection Modal */}
      <ProductSelectionModal
        isOpen={isBuyNowOpen}
        onClose={() => setIsBuyNowOpen(false)}
        product={activeProduct}
        onConfirm={onConfirmSelection}
        mode={selectionMode}
      />
    </div>
  );
};

export default Shop;
