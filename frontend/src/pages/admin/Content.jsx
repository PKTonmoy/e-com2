import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/api.js';

const AdminContent = () => {
  const qc = useQueryClient();
  const { data: hero } = useQuery({
    queryKey: ['content', 'hero'],
    queryFn: async () => (await api.get('/content/hero')).data,
  });
  const [html, setHtml] = useState(hero?.html || '<p>Elegant content block</p>');
  const mutation = useMutation({
    mutationFn: () => api.post('/content/hero', { html }),
    onSuccess: () => qc.invalidateQueries(['content', 'hero']),
  });

  return (
    <div className="lux-container py-10 space-y-4">
      <h1 className="lux-heading">Admin Content</h1>
      <div className="lux-card p-4 space-y-3">
        <p className="font-semibold">Homepage Hero HTML</p>
        <textarea
          className="w-full border p-3 rounded-lg min-h-[180px]"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
        />
        <button className="lux-btn-primary" onClick={() => mutation.mutate()}>
          Save
        </button>
      </div>
    </div>
  );
};

export default AdminContent;

