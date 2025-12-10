import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { getImageUrl } from '../../utils/imageUrl.js';

const BlogAdmin = () => {
    const qc = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        contentHTML: '',
        coverImage: '',
        category: '',
        tags: '',
    });
    const [uploading, setUploading] = useState(false);

    // Handle cover image upload
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
            setFormData(prev => ({ ...prev, coverImage: res.data.url }));
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['admin-blog'],
        queryFn: async () => {
            const res = await api.get('/blog');
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/blog', data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-blog']);
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/blog/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries(['admin-blog']);
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/blog/${id}`),
        onSuccess: () => qc.invalidateQueries(['admin-blog']),
    });

    const openModal = (post = null) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title || '',
                slug: post.slug || '',
                excerpt: post.excerpt || '',
                contentHTML: post.contentHTML || '',
                coverImage: post.coverImage || '',
                category: post.category || '',
                tags: post.tags?.join(', ') || '',
            });
        } else {
            setEditingPost(null);
            setFormData({
                title: '',
                slug: '',
                excerpt: '',
                contentHTML: '',
                coverImage: '',
                category: '',
                tags: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPost(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        };

        if (editingPost) {
            updateMutation.mutate({ id: editingPost._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this blog post?')) {
            deleteMutation.mutate(id);
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Blog Management</h1>
                <button onClick={() => openModal()} className="lux-btn-primary flex items-center justify-center gap-2 text-sm">
                    <PlusIcon className="h-5 w-5" />
                    New Post
                </button>
            </div>

            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-neutral-100 rounded-lg" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="lux-card p-8 text-center">
                    <PhotoIcon className="h-12 w-12 mx-auto text-gold/50 mb-4" />
                    <p className="text-neutral-600">No blog posts yet.</p>
                    <button onClick={() => openModal()} className="lux-btn-primary mt-4">
                        Create Your First Post
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {posts.map((post) => (
                        <div key={post._id} className="lux-card p-4 flex items-center gap-4">
                            {post.coverImage ? (
                                <img
                                    src={getImageUrl(post.coverImage)}
                                    alt={post.title}
                                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-14 bg-neutral-100 dark:bg-matte/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <PhotoIcon className="h-6 w-6 text-neutral-400" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{post.title}</p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                                    {post.excerpt || 'No excerpt'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {post.category && (
                                        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded">
                                            {post.category}
                                        </span>
                                    )}
                                    <span className="text-xs text-neutral-500">
                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openModal(post)}
                                    className="p-2 text-neutral-600 hover:text-gold transition"
                                >
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(post._id)}
                                    className="p-2 text-neutral-600 hover:text-red-600 transition"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-matte rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-matte border-b border-gold/20 p-4 flex items-center justify-between">
                            <h2 className="font-display text-xl">
                                {editingPost ? 'Edit Post' : 'New Post'}
                            </h2>
                            <button onClick={closeModal} className="p-1 hover:bg-neutral-100 dark:hover:bg-matte/50 rounded">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            title: e.target.value,
                                            slug: prev.slug || generateSlug(e.target.value),
                                        }));
                                    }}
                                    className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                                    placeholder="Enter post title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Slug *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                                    placeholder="post-url-slug"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cover Image</label>
                                <div className="flex gap-3 items-start">
                                    <div className="flex-1">
                                        <input
                                            type="url"
                                            value={formData.coverImage}
                                            onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                            className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                                            placeholder="https://example.com/image.jpg (or upload)"
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
                                {formData.coverImage && (
                                    <img
                                        src={getImageUrl(formData.coverImage)}
                                        alt="Preview"
                                        className="mt-2 h-32 object-cover rounded-lg"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                                        placeholder="e.g., Lifestyle"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                        className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                                        placeholder="luxury, fashion, style"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Excerpt</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                    className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30 min-h-[80px]"
                                    placeholder="Short description for previews"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Content (HTML) *</label>
                                <textarea
                                    required
                                    value={formData.contentHTML}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contentHTML: e.target.value }))}
                                    className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30 min-h-[200px] font-mono"
                                    placeholder="<p>Your blog content here...</p>"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gold/20">
                                <button type="button" onClick={closeModal} className="lux-btn border border-gold/40">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="lux-btn-primary"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogAdmin;
