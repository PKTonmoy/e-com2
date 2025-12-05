import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';

const AdminRoute = () => {
    const location = useLocation();

    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            try {
                const res = await api.get('/auth/me');
                return res.data;
            } catch (err) {
                return null;
            }
        },
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-ivory dark:bg-matte">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
