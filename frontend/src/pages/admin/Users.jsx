import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrashIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const AdminUsers = () => {
  const qc = useQueryClient();
  const { addToast } = useToast();

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

  return (
    <div className="lux-container py-10 space-y-4">
      <h1 className="lux-heading">Admin Users & Roles</h1>
      <div className="lux-card p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-gold/20">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select
                    value={u.role}
                    onChange={(e) => {
                      updateRoleMutation.mutate({
                        id: u._id,
                        role: e.target.value,
                      });
                    }}
                    className="border border-gold/30 rounded-lg px-3 py-1 text-sm bg-ivory/80 dark:bg-matte font-body"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-2">
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
    </div>
  );
};

export default AdminUsers;
