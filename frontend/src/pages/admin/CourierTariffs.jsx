import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const emptyForm = {
  originDistrict: 'Rajshahi',
  destinationDistrict: '',
  serviceType: 'regular',
  category: 'regular',
  baseWeightKg: 0.5,
  maxWeightKg: 1,
  price: 0,
  active: true,
};

const CourierTariffs = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const { data: tariffs = [], isLoading } = useQuery({
    queryKey: ['courier-tariffs'],
    queryFn: async () => (await api.get('/admin/courier-tariffs')).data,
  });

  const { data: destinationsData } = useQuery({
    queryKey: ['delivery-destinations-admin'],
    queryFn: async () => (await api.get('/delivery/destinations')).data,
  });

  const destinations = destinationsData?.destinations || [];

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingId) {
        return api.put(`/admin/courier-tariffs/${editingId}`, payload);
      }
      return api.post('/admin/courier-tariffs', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries(['courier-tariffs']);
      addToast('Tariff saved successfully', 'success');
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to save tariff', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/courier-tariffs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['courier-tariffs']);
      addToast('Tariff deleted', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete tariff', 'error');
    },
  });

  const handleEdit = (t) => {
    setEditingId(t._id);
    setForm({
      originDistrict: t.originDistrict,
      destinationDistrict: t.destinationDistrict,
      serviceType: t.serviceType,
      category: t.category,
      baseWeightKg: t.baseWeightKg,
      maxWeightKg: t.maxWeightKg,
      price: t.price,
      active: t.active,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">
          Steadfast Courier Tariffs
        </h1>
        {editingId && (
          <button
            type="button"
            className="text-xs text-neutral-500 hover:text-gold"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
          >
            Clear edit
          </button>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="lux-card p-4 sm:p-6 grid gap-4 sm:grid-cols-6 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Origin District</label>
          <input
            type="text"
            className="w-full border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-transparent"
            value={form.originDistrict}
            onChange={(e) => setForm({ ...form, originDistrict: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Destination City / Thana</label>
          <select
            className="w-full border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-transparent"
            value={form.destinationDistrict}
            onChange={(e) => setForm({ ...form, destinationDistrict: e.target.value })}
          >
            <option value="">
              {destinations.length ? 'Select destination' : 'No destinations loaded'}
            </option>
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}{d.district ? `, ${d.district}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Price (TK)</label>
          <input
            type="number"
            min="0"
            className="w-full border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-transparent"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="tariff-active"
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="accent-gold"
          />
          <label htmlFor="tariff-active" className="text-xs">
            Active
          </label>
        </div>
        <div className="sm:col-span-6 flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isLoading}
            className="px-4 py-2 bg-gold text-matte text-sm font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50"
          >
            {editingId ? 'Update Tariff' : 'Add Tariff'}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="lux-card p-4 sm:p-6">
        <h2 className="font-display text-sm sm:text-base mb-3">Configured Tariffs</h2>
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : tariffs.length === 0 ? (
          <p className="text-sm text-neutral-500">No tariffs configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left">
                  <th className="py-2 pr-4">Origin</th>
                  <th className="py-2 pr-4">Destination</th>
                  <th className="py-2 pr-4">Price (TK)</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                  >
                    <td className="py-2 pr-4">{t.originDistrict}</td>
                    <td className="py-2 pr-4">{t.destinationDistrict}</td>
                    <td className="py-2 pr-4">৳{t.price}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          t.active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                            : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-gold hover:underline"
                        onClick={() => handleEdit(t)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => {
                          if (window.confirm('Delete this tariff?')) {
                            deleteMutation.mutate(t._id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourierTariffs;


