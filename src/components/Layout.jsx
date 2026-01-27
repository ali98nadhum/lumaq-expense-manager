import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Banknote, Package, LogOut, FileText, Users } from 'lucide-react';

const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
        { path: '/reports', label: 'التقارير السنوية', icon: <FileText size={20} /> },
        { path: '/expenses', label: 'المصاريف', icon: <Banknote size={20} /> },
        { path: '/orders', label: 'الطلبات', icon: <ShoppingCart size={20} /> },
        { path: '/customers', label: 'الزبائن', icon: <Users size={20} /> },
        { path: '/products', label: 'المنتجات', icon: <Package size={20} /> },
    ];

    return (
        <div className="flex" style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside className="card" style={{
                width: '260px',
                borderRadius: '0',
                margin: '0',
                position: 'fixed',
                right: '0',
                top: '0',
                bottom: '0',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="flex-center" style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h2 className="text-gold" style={{ margin: 0 }}>لوماك كوزمتك</h2>
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <ul className="flex flex-col gap-sm">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className="flex"
                                    style={{
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        color: location.pathname === item.path ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                        background: location.pathname === item.path ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                        fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                                    }}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        مرحباً، {user?.username}
                    </div>
                    <button
                        onClick={logout}
                        className="btn btn-danger flex-center"
                        style={{ width: '100%', gap: '0.5rem' }}
                    >
                        <LogOut size={18} />
                        تسجيل خروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginRight: '260px', /* Sidebar width */
                padding: '2rem',
                maxWidth: 'calc(100vw - 260px)'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
