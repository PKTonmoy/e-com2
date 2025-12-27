import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

const AdminProducts = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
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
    hasSizes: true,
    sizes: ALL_SIZES,
  });
  const [uploading, setUploading] = useState(false);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];
    const totalFiles = files.length;
    let uploadedCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          addToast(`${file.name} is too large (max 5MB)`, 'error');
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
          const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (res.data.url) {
            uploadedUrls.push(res.data.url);
            uploadedCount++;
          }
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls]
        }));
        addToast(`${uploadedCount} image(s) uploaded successfully!`);
      } else {
        addToast('No images were uploaded', 'error');
      }
    } catch (err) {
      addToast('Upload failed', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Remove image from array
  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Move image up
  const moveImageUp = (index) => {
    if (index === 0) return;
    setForm(prev => {
      const newImages = [...prev.images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return { ...prev, images: newImages };
    });
  };

  // Move image down
  const moveImageDown = (index) => {
    if (index === form.images.length - 1) return;
    setForm(prev => {
      const newImages = [...prev.images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return { ...prev, images: newImages };
    });
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
      images: [],
      limitedEdition: false,
      hasSizes: true,
      sizes: ALL_SIZES,
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
      images: product.images || [],
      limitedEdition: product.limitedEdition || false,
      hasSizes: product.hasSizes !== false,
      sizes: product.sizes || ALL_SIZES,
    });
    setShowModal(true);
  };

  const toggleSize = (size) => {
    setForm((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate that at least one image is uploaded
    if (!form.images || form.images.length === 0) {
      addToast('Please upload at least one image', 'error');
      return;
    }

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
                  className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  required
                  className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Slug (e.g., product-name)"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
                <input
                  required
                  className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  required
                  type="number"
                  className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
                <input
                  className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <textarea
                className="w-full border border-gold/30 p-3 rounded-lg min-h-[100px] bg-white dark:bg-matte/80 text-matte dark:text-ivory placeholder-neutral-400 dark:placeholder-neutral-500"
                placeholder="Description HTML"
                value={form.descriptionHTML}
                onChange={(e) => setForm({ ...form, descriptionHTML: e.target.value })}
              />

              {/* Multiple Images Upload Section */}
              <div className="space-y-2 border border-gold/30 rounded-lg p-4 bg-gold/5">
                <label className="block text-sm font-medium">Product Images (Multiple)</label>
                <p className="text-xs text-neutral-500 mb-3">Upload multiple images. The first image will be the main product image.</p>

                <label className="lux-btn border border-gold/40 flex items-center gap-2 cursor-pointer justify-center py-3 hover:bg-gold/10 transition">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Images'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>

                {/* Image Gallery */}
                {form.images.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-neutral-600">Images ({form.images.length})</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={getImageUrl(img)}
                            alt={`Product ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gold/20"
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 text-xs bg-gold text-matte px-1.5 py-0.5 rounded">Main</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImageUp(idx)}
                                className="p-1.5 bg-gold/90 text-matte rounded hover:bg-gold transition text-xs"
                                title="Move up"
                              >
                                ↑
                              </button>
                            )}
                            {idx < form.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImageDown(idx)}
                                className="p-1.5 bg-gold/90 text-matte rounded hover:bg-gold transition text-xs"
                                title="Move down"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
                              title="Delete"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

              {/* Size Options Section */}
              <div className="p-4 border border-gold/30 rounded-lg bg-gold/5 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasSizes"
                    checked={form.hasSizes}
                    onChange={(e) => setForm({ ...form, hasSizes: e.target.checked })}
                    className="w-5 h-5 accent-gold rounded"
                  />
                  <label htmlFor="hasSizes" className="flex flex-col cursor-pointer">
                    <span className="font-semibold text-sm">This product has sizes</span>
                    <span className="text-xs text-neutral-500">Enable size selection for this product (disable for watches, accessories, etc.)</span>
                  </label>
                </div>

                {form.hasSizes && (
                  <div className="pt-3 border-t border-gold/20">
                    <p className="text-sm font-medium mb-2">Available Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`w-12 h-10 rounded-lg border-2 font-semibold text-sm transition-all ${form.sizes.includes(size)
                            ? 'bg-gold text-matte border-gold'
                            : 'border-gold/40 hover:border-gold/70 bg-transparent'
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Click to toggle which sizes are available for this product</p>
                  </div>
                )}
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
