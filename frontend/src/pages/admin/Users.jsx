import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const AdminUsers = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [expandedUser, setExpandedUser] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/admin/users/${id}`, { role }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      addToast('User role updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      addToast('User deleted!');
    },
  });

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  return (
    <div className="lux-container py-10 space-y-4">
      <h1 className="lux-heading">Admin Users & Roles</h1>
      <p className="text-sm text-neutral-500">{users.length} users registered</p>

      <div className="lux-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gold/10">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Address</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Role</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-gold/20">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400">{u.email}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400">{u.phone || '-'}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate">{u.address || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${u.provider === 'google' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                      {u.provider || 'local'}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRoleMutation.mutate({ id: u._id, role: e.target.value })}
                      className="border border-gold/30 rounded-lg px-3 py-1 text-sm bg-ivory/80 dark:bg-matte font-body"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        if (confirm(`Delete user ${u.name}?`)) {
                          deleteMutation.mutate(u._id);
                        }
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gold/20">
          {users.map((u) => (
            <div key={u._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-sm text-neutral-500 truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => toggleExpand(u._id)}
                  className="p-2 hover:bg-gold/10 rounded-lg transition"
                >
                  {expandedUser === u._id ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {expandedUser === u._id && (
                <div className="mt-3 pt-3 border-t border-gold/20 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phone:</span>
                    <span>{u.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Address:</span>
                    <span className="text-right max-w-[60%] truncate">{u.address || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Provider:</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${u.provider === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-700'}`}>
                      {u.provider || 'local'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Role:</span>
                    <select
                      value={u.role}
                      onChange={(e) => updateRoleMutation.mutate({ id: u._id, role: e.target.value })}
                      className="border border-gold/30 rounded px-2 py-1 text-xs bg-transparent"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete user ${u.name}?`)) {
                        deleteMutation.mutate(u._id);
                      }
                    }}
                    className="w-full mt-2 py-2 text-red-600 text-sm border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
