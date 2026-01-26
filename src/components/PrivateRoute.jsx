import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex-center" style={{ height: '100vh' }}>جاري التحميل...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <div className="flex-center" style={{ height: '100vh' }}>غير مصرح لك بالدخول</div>;
    }

    return children;
};

export default PrivateRoute;
