import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PhotoIcon, CheckCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import ImageUpload from '../../components/ImageUpload.jsx';

const TABS = [
  { id: 'home', label: 'Home Page' },
  { id: 'shop', label: 'Shop Page' },
  { id: 'cart', label: 'Cart Page' },
  { id: 'profile', label: 'Profile Page' },
];

const DEFAULT_CONTENT = {
  'home.hero': {
    promoBanner: { text: 'EXTRA 20% OFF ON SELECTED ITEMS', code: 'HH2D', enabled: true },
    title: 'FASHION',
    subtitle: 'FOR EVERY MOMENT',
    description: 'Explore fashion-forward clothing, shoes, and accessories. Curated collections for every season and occasion.',
    buttonText: 'EXPLORE MORE',
    buttonLink: '/shop',
    heroImages: [
      { url: '', alt: 'Fashion image 1' },
      { url: '', alt: 'Fashion image 2' },
      { url: '', alt: 'Fashion image 3' },
      { url: '', alt: 'Fashion image 4' },
    ],
    trustBadges: [
      { icon: 'flag', label: 'Authentic Italian', sublabel: 'Brands' },
      { icon: 'currency', label: 'Exclusive Pricing', sublabel: '' },
      { icon: 'shield', label: 'Secure Payments &', sublabel: 'Fast Shipping' },
      { icon: 'truck', label: '21k+ Products', sublabel: 'Delivered' },
    ]
  },
  'home.limitedDrops': {
    title: 'Limited Drops',
    buttonText: 'View all',
    buttonLink: '/shop',
  },
  'home.blog': {
    title: 'From the Editorial',
    subtitle: 'Stories, ateliers, and the PRELUX gaze.',
    buttonText: 'Read more',
    buttonLink: '/blog',
  },
  'shop.header': {
    title: 'The Collection',
    filterLabel: 'Filter & Sort',
  },
  'cart.header': {
    title: 'Your Cart',
    emptyMessage: 'Your cart is empty.',
    emptyLink: 'Discover the collection.',
  },
  'profile.header': {
    title: 'Profile',
    welcomeTitle: 'Welcome to PRELUX',
    welcomeSubtitle: 'Sign in to view your profile, track orders, and manage your wishlist.',
  },
};

const ContentEditor = ({ contentKey, label, fields }) => {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['content', contentKey],
    queryFn: async () => {
      const res = await api.get(`/content/${contentKey}`);
      return res.data?.content || DEFAULT_CONTENT[contentKey] || {};
    },
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (data) {
      setFormData({ ...DEFAULT_CONTENT[contentKey], ...data });
    }
  }, [data, contentKey]);

  const mutation = useMutation({
    mutationFn: () => api.post(`/content/${contentKey}`, { content: formData }),
    onSuccess: () => {
      qc.invalidateQueries(['content', contentKey]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const arr = [...(prev[arrayName] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [arrayName]: arr };
    });
  };

  if (isLoading) return <div className="animate-pulse h-32 bg-neutral-100 rounded-lg" />;

  return (
    <div className="lux-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-lg">{label}</p>
        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircleIcon className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30 min-h-[100px]"
                placeholder={field.placeholder}
              />
            ) : field.type === 'image' ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                  placeholder="https://example.com/image.jpg"
                />
                {formData[field.name] && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-neutral-100">
                    <img src={formData[field.name]} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.nested ? formData[field.parent]?.[field.name] : formData[field.name]}
                  onChange={(e) => field.nested
                    ? handleNestedChange(field.parent, field.name, e.target.checked)
                    : handleChange(field.name, e.target.checked)
                  }
                  className="w-4 h-4 text-gold rounded border-gold/30"
                />
                <span className="text-sm text-neutral-600">Enable</span>
              </label>
            ) : field.nested ? (
              <input
                type="text"
                value={formData[field.parent]?.[field.name] || ''}
                onChange={(e) => handleNestedChange(field.parent, field.name, e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                placeholder={field.placeholder}
              />
            ) : (
              <input
                type="text"
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="lux-btn-primary"
      >
        {mutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

// Hero Images Editor Component
const HeroImagesEditor = () => {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['content', 'home.hero'],
    queryFn: async () => {
      const res = await api.get('/content/home.hero');
      return res.data?.content || DEFAULT_CONTENT['home.hero'];
    },
  });

  const [formData, setFormData] = useState(DEFAULT_CONTENT['home.hero']);

  useEffect(() => {
    if (data) {
      setFormData({ ...DEFAULT_CONTENT['home.hero'], ...data });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.post('/content/home.hero', { content: formData }),
    onSuccess: () => {
      qc.invalidateQueries(['content', 'home.hero']);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleImageChange = (index, field, value) => {
    setFormData(prev => {
      const images = [...(prev.heroImages || [])];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, heroImages: images };
    });
  };

  const handleBadgeChange = (index, field, value) => {
    setFormData(prev => {
      const badges = [...(prev.trustBadges || [])];
      badges[index] = { ...badges[index], [field]: value };
      return { ...prev, trustBadges: badges };
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePromoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      promoBanner: { ...prev.promoBanner, [field]: value }
    }));
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-neutral-100 rounded-lg" />;

  return (
    <div className="space-y-6">
      {/* Promo Banner */}
      <div className="lux-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-lg">Promo Banner</p>
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircleIcon className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Banner Text</label>
            <input
              type="text"
              value={formData.promoBanner?.text || ''}
              onChange={(e) => handlePromoChange('text', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              placeholder="EXTRA 20% OFF ON SELECTED ITEMS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Promo Code</label>
            <input
              type="text"
              value={formData.promoBanner?.code || ''}
              onChange={(e) => handlePromoChange('code', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              placeholder="HH2D"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.promoBanner?.enabled ?? true}
                onChange={(e) => handlePromoChange('enabled', e.target.checked)}
                className="w-4 h-4 text-gold rounded border-gold/30"
              />
              <span className="text-sm">Show Banner</span>
            </label>
          </div>
        </div>
      </div>

      {/* Hero Text */}
      <div className="lux-card p-5 space-y-4">
        <p className="font-semibold text-lg">Hero Text</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Main Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              placeholder="FASHION"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              placeholder="FOR EVERY MOMENT"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30 min-h-[80px]"
              placeholder="Explore fashion-forward clothing..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Button Text</label>
            <input
              type="text"
              value={formData.buttonText || ''}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              placeholder="EXPLORE MORE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Button Link</label>
            <input
              type="text"
              value={formData.buttonLink || ''}
              onChange={(e) => handleChange('buttonLink', e.target.value)}
              className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              placeholder="/shop"
            />
          </div>
        </div>
      </div>

      {/* Hero Images */}
      <div className="lux-card p-5 space-y-4">
        <p className="font-semibold text-lg">Hero Images (4 Required)</p>
        <p className="text-sm text-neutral-500">You can upload images from your computer or use external URLs</p>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="p-4 border border-gold/20 rounded-lg space-y-3">
              <ImageUpload
                label={`Image ${index + 1}`}
                value={formData.heroImages?.[index]?.url || ''}
                onChange={(url) => handleImageChange(index, 'url', url)}
                previewSize="lg"
              />
              <input
                type="text"
                value={formData.heroImages?.[index]?.alt || ''}
                onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                placeholder="Alt text (for accessibility)"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="lux-card p-5 space-y-4">
        <p className="font-semibold text-lg">Trust Badges</p>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="p-4 border border-gold/20 rounded-lg space-y-3">
              <p className="font-medium text-sm">Badge {index + 1}</p>
              <select
                value={formData.trustBadges?.[index]?.icon || 'flag'}
                onChange={(e) => handleBadgeChange(index, 'icon', e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
              >
                <option value="flag">🇮🇹 Flag</option>
                <option value="currency">💰 Currency</option>
                <option value="shield">🛡️ Shield</option>
                <option value="truck">🚚 Truck</option>
              </select>
              <input
                type="text"
                value={formData.trustBadges?.[index]?.label || ''}
                onChange={(e) => handleBadgeChange(index, 'label', e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                placeholder="Label"
              />
              <input
                type="text"
                value={formData.trustBadges?.[index]?.sublabel || ''}
                onChange={(e) => handleBadgeChange(index, 'sublabel', e.target.value)}
                className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                placeholder="Sublabel (optional)"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="lux-btn-primary w-full"
      >
        {mutation.isPending ? 'Saving Hero Section...' : 'Save All Hero Changes'}
      </button>
    </div>
  );
};

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Site Content Management</h1>
        <PhotoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gold" />
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-1 border-b border-gold/20 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
              ? 'text-gold border-b-2 border-gold -mb-px'
              : 'text-neutral-600 hover:text-gold'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'home' && (
          <>
            <HeroImagesEditor />
            <ContentEditor
              contentKey="home.limitedDrops"
              label="Limited Drops Section"
              fields={[
                { name: 'title', label: 'Section Title' },
                { name: 'buttonText', label: 'View All Button Text' },
                { name: 'buttonLink', label: 'View All Link' },
              ]}
            />
            <ContentEditor
              contentKey="home.blog"
              label="Blog Section"
              fields={[
                { name: 'title', label: 'Section Title' },
                { name: 'subtitle', label: 'Subtitle' },
                { name: 'buttonText', label: 'Read More Text' },
                { name: 'buttonLink', label: 'Read More Link' },
              ]}
            />
          </>
        )}

        {activeTab === 'shop' && (
          <ContentEditor
            contentKey="shop.header"
            label="Shop Page Header"
            fields={[
              { name: 'title', label: 'Page Title', placeholder: 'The Collection' },
              { name: 'filterLabel', label: 'Filter Section Label', placeholder: 'Filter & Sort' },
            ]}
          />
        )}

        {activeTab === 'cart' && (
          <ContentEditor
            contentKey="cart.header"
            label="Cart Page Content"
            fields={[
              { name: 'title', label: 'Page Title', placeholder: 'Your Cart' },
              { name: 'emptyMessage', label: 'Empty Cart Message' },
              { name: 'emptyLink', label: 'Empty Cart Link Text' },
            ]}
          />
        )}

        {activeTab === 'profile' && (
          <ContentEditor
            contentKey="profile.header"
            label="Profile Page Content"
            fields={[
              { name: 'title', label: 'Page Title', placeholder: 'Profile' },
              { name: 'welcomeTitle', label: 'Welcome Title (for logged out)' },
              { name: 'welcomeSubtitle', label: 'Welcome Subtitle', type: 'textarea', fullWidth: true },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default AdminContent;
