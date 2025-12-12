/**
 * Image Upload Component
 * Allows uploading images from local filesystem or using external URLs
 */

import { useState, useRef } from 'react';
import { CloudArrowUpIcon, TrashIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';

const ImageUpload = ({
    value,
    onChange,
    label = 'Image',
    placeholder = 'Enter image URL or upload',
    showPreview = true,
    previewSize = 'md' // 'sm', 'md', 'lg'
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('url'); // 'url' or 'upload'
    const fileInputRef = useRef(null);

    const previewSizes = {
        sm: 'w-20 h-20',
        md: 'w-32 h-32',
        lg: 'w-48 h-64'
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('File too large. Maximum size is 5MB.');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                // Construct full URL for the image
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                // If it's a relative path (local upload), prepend base URL. If absolute (Cloudinary), use as is.
                const isAbsolute = response.data.url.startsWith('http');
                const imageUrl = isAbsolute ? response.data.url : baseUrl + response.data.url;
                onChange(imageUrl);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUrlChange = (e) => {
        setError('');
        onChange(e.target.value);
    };

    const handleClear = () => {
        onChange('');
        setError('');
    };

    return (
        <div className="space-y-2">
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {label}
                </label>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${mode === 'url'
                        ? 'bg-gold/20 text-gold border border-gold/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${mode === 'upload'
                        ? 'bg-gold/20 text-gold border border-gold/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                >
                    <CloudArrowUpIcon className="w-3.5 h-3.5" />
                    Upload
                </button>
            </div>

            {/* URL Input */}
            {mode === 'url' && (
                <input
                    type="url"
                    value={value || ''}
                    onChange={handleUrlChange}
                    className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-matte/30"
                    placeholder={placeholder}
                />
            )}

            {/* Upload Input */}
            {mode === 'upload' && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gold/30 rounded-lg p-6 text-center cursor-pointer hover:border-gold/50 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
                            <p className="text-sm text-neutral-500">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <CloudArrowUpIcon className="w-10 h-10 text-gold/50" />
                            <p className="text-sm text-neutral-500">
                                Click to upload or drag & drop
                            </p>
                            <p className="text-xs text-neutral-400">
                                JPEG, PNG, GIF, WebP (max 5MB)
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Preview */}
            {showPreview && value && (
                <div className="flex items-start gap-3 mt-3">
                    <div className={`${previewSizes[previewSize]} rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative group`}>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTUtNUw1IDIxIi8+PC9zdmc+';
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 truncate" title={value}>
                            {value}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
