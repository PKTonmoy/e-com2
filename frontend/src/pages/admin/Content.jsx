import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';

const TABS = [
  { id: 'home', label: 'Home Page' },
  { id: 'shop', label: 'Shop Page' },
  { id: 'cart', label: 'Cart Page' },
  { id: 'profile', label: 'Profile Page' },
];

const DEFAULT_CONTENT = {
  'home.hero': {
    badge: 'PRELUX Collection',
    title: 'Crafted for the few. Objects of quiet power.',
    subtitle: 'A curated house of watches, couture, interiors, and fragrance. Hand-finished, limited, and destined for discerning circles.',
    image: '',
    buttonText: 'Discover the collection',
    buttonLink: '/shop',
    button2Text: 'Editorial stories',
    button2Link: '/blog',
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

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="lux-container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="lux-heading">Site Content Management</h1>
        <PhotoIcon className="h-8 w-8 text-gold" />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gold/20">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id
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
            <ContentEditor
              contentKey="home.hero"
              label="Hero Section"
              fields={[
                { name: 'badge', label: 'Badge Text', placeholder: 'PRELUX Collection' },
                { name: 'image', label: 'Background Image URL', type: 'image', fullWidth: true },
                { name: 'title', label: 'Main Title', fullWidth: true },
                { name: 'subtitle', label: 'Subtitle', type: 'textarea', fullWidth: true },
                { name: 'buttonText', label: 'Button 1 Text' },
                { name: 'buttonLink', label: 'Button 1 Link' },
                { name: 'button2Text', label: 'Button 2 Text' },
                { name: 'button2Link', label: 'Button 2 Link' },
              ]}
            />
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
