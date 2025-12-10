import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

const AdminProducts = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    descriptionHTML: '',
    images: [''],
    limitedEdition: false,
  });
  const [uploading, setUploading] = useState(false);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Use the returned URL
      setForm(prev => ({ ...prev, images: [res.data.url] }));
      addToast('Image uploaded successfully!');
    } catch (err) {
      addToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await api.get('/products')).data,
  });

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-products']);
      setShowModal(false);
      resetForm();
      addToast('Product created successfully!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-products']);
      setShowModal(false);
      resetForm();
      addToast('Product updated successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-products']);
      addToast('Product deleted!');
    },
  });

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      sku: '',
      price: '',
      stock: '',
      category: '',
      descriptionHTML: '',
      images: [''],
      limitedEdition: false,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      category: product.category || '',
      descriptionHTML: product.descriptionHTML || '',
      images: product.images || [''],
      limitedEdition: product.limitedEdition || false,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Admin Products</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="lux-btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Add Product
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-gold/30 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-ivory/80 dark:bg-matte font-body"
        />
      </div>

      <div className="lux-card p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Title</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Price</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Limited</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p._id} className="border-t border-gold/20">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {p.title}
                    {p.limitedEdition && (
                      <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded">LIMITED</span>
                    )}
                  </div>
                </td>
                <td className="p-2">{p.sku}</td>
                <td className="p-2">${p.salePrice || p.price}</td>
                <td className="p-2">{p.stock}</td>
                <td className="p-2">
                  {p.limitedEdition ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                  ) : (
                    <span className="text-neutral-400">No</span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1 hover:bg-gold/10 rounded transition"
                    >
                      <PencilIcon className="h-4 w-4 text-gold" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) {
                          deleteMutation.mutate(p._id);
                        }
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="lux-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl mb-4">
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  className="border p-3 rounded-lg"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  required
                  className="border p-3 rounded-lg"
                  placeholder="Slug (e.g., product-name)"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
                <input
                  required
                  className="border p-3 rounded-lg"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  className="border p-3 rounded-lg"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  required
                  type="number"
                  className="border p-3 rounded-lg"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
                <input
                  className="border p-3 rounded-lg"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <textarea
                className="w-full border p-3 rounded-lg min-h-[100px]"
                placeholder="Description HTML"
                value={form.descriptionHTML}
                onChange={(e) => setForm({ ...form, descriptionHTML: e.target.value })}
              />
              {/* Image Upload Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Product Image</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      className="w-full border p-3 rounded-lg"
                      placeholder="Image URL (or upload below)"
                      value={form.images[0]}
                      onChange={(e) => setForm({ ...form, images: [e.target.value] })}
                    />
                  </div>
                  <label className="lux-btn border border-gold/40 flex items-center gap-2 cursor-pointer">
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {form.images[0] && (
                  <img
                    src={getImageUrl(form.images[0])}
                    alt="Preview"
                    className="mt-2 h-32 w-auto object-cover rounded-lg border border-gold/20"
                  />
                )}
              </div>

              {/* Limited Edition Toggle */}
              <div className="flex items-center gap-3 p-4 border border-gold/30 rounded-lg bg-gold/5">
                <input
                  type="checkbox"
                  id="limitedEdition"
                  checked={form.limitedEdition}
                  onChange={(e) => setForm({ ...form, limitedEdition: e.target.checked })}
                  className="w-5 h-5 accent-gold rounded"
                />
                <label htmlFor="limitedEdition" className="flex flex-col cursor-pointer">
                  <span className="font-semibold text-sm">Limited Edition</span>
                  <span className="text-xs text-neutral-500">Mark this product as a limited drop (shown on homepage)</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="lux-btn-primary">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="lux-btn border border-gold/40"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
