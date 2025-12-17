import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
    PaperAirplaneIcon,
    UsersIcon,
    FunnelIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const AdminNotifications = () => {
    const [activeTab, setActiveTab] = useState('create'); // 'create', 'history'
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'system', // system, promo, order
        targetType: 'all', // all, user
        targetId: '',
        url: '',
        imageUrl: '',
        priority: 'normal'
    });

    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/admin/notifications');
            setHistory(data.notifications);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        try {
            await api.post('/admin/notifications', formData);
            setSuccessMsg('Notification sent successfully!');
            setFormData({ ...formData, title: '', message: '', targetId: '' });
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to send: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display">Notification Center</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'create' ? 'bg-gold text-matte' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        Send New
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'history' ? 'bg-gold text-matte' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'create' ? (
                <div className="max-w-3xl bg-white dark:bg-zinc-900 p-4 md:p-8 rounded-2xl shadow-sm border border-gold/10">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <PaperAirplaneIcon className="w-6 h-6 text-gold" />
                        Compose Notification
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                                >
                                    <option value="system">System Message</option>
                                    <option value="promo">Promotion</option>
                                    <option value="order">Order Update</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Audience</label>
                                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="all"
                                            checked={formData.targetType === 'all'}
                                            onChange={handleChange}
                                            className="text-gold focus:ring-gold"
                                        />
                                        <span className="flex items-center gap-1"><UsersIcon className="w-4 h-4" /> All Users</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="user"
                                            checked={formData.targetType === 'user'}
                                            onChange={handleChange}
                                            className="text-gold focus:ring-gold"
                                        />
                                        <span className="flex items-center gap-1"><FunnelIcon className="w-4 h-4" /> Specific User</span>
                                    </label>
                                </div>
                            </div>

                            {formData.targetType === 'user' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">User ID</label>
                                    <input
                                        type="text"
                                        name="targetId"
                                        value={formData.targetId}
                                        onChange={handleChange}
                                        placeholder="User ObjectId"
                                        className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Summer Sale is Live!"
                                className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Message Body</label>
                            <textarea
                                name="message"
                                required
                                rows="3"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Write your message here..."
                                className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Action URL (Optional)</label>
                                <input
                                    type="text"
                                    name="url"
                                    value={formData.url}
                                    onChange={handleChange}
                                    placeholder="/shop/summer-collection"
                                    className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                                <input
                                    type="text"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full rounded-lg border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 p-2"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-3 bg-gold text-matte font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Notification'}
                            </button>
                            {successMsg && (
                                <p className="mt-4 text-green-600 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5" /> {successMsg}
                                </p>
                            )}
                        </div>

                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map(item => (
                        <div key={item._id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.message}</p>
                                <div className="flex gap-3 text-xs text-gray-400 mt-2">
                                    <span className="capitalize bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{item.type}</span>
                                    <span>To: {item.userId ? (item.userId.customId ? `User (${item.userId.customId})` : 'User') : 'Alle'}</span>
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {/* Actions like edit or resend could go here */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
