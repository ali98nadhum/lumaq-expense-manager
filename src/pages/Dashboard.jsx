import { useEffect, useState } from 'react';
import api from '../utils/api';
import StatsCard from '../components/StatsCard';
import { DollarSign, ShoppingBag, TrendingUp, TrendingDown } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [topLoading, setTopLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchTopProducts();
    }, [period]);

    const fetchStats = async () => {
        try {
            const [dashboardRes, yearlyRes] = await Promise.all([
                api.get('/reports/dashboard'),
                api.get('/reports/yearly')
            ]);
            setStats({
                ...dashboardRes.data.data,
                yearly: yearlyRes.data.data
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopProducts = async () => {
        setTopLoading(true);
        try {
            const { data } = await api.get(`/reports/performance?period=${period}`);
            setTopProducts(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setTopLoading(false);
        }
    };

    if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>;
    if (!stats) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>لا توجد بيانات</div>;

    const { today, weekly, monthly, totals } = stats;

    const formatDate = (daysAgo) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${year}/${month}/${day}`;
    };

    const renderTimeframeSection = (title, data, dateRange) => (
        <div style={{ marginBottom: '3rem' }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderRight: '4px solid var(--accent-gold)', paddingRight: '1rem' }}>
                <h2 style={{ margin: 0 }}>{title}</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{dateRange}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <StatsCard
                    title="الربح الصافي"
                    value={data.profit.toLocaleString()}
                    icon={TrendingUp}
                    color="green"
                />
                <StatsCard
                    title="راس المال المسترجع"
                    value={data.capital.toLocaleString()}
                    icon={DollarSign}
                    color="gold"
                />
                <StatsCard
                    title="المصاريف"
                    value={data.expenses.toLocaleString()}
                    icon={TrendingDown}
                    color="red"
                />
                <StatsCard
                    title="عدد الطلبات"
                    value={data.orderCount}
                    icon={ShoppingBag}
                    color="purple"
                />
            </div>
        </div>
    );

    const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <h1 style={{ marginBottom: '2.5rem' }}>التحليل الـمالي</h1>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>اتجاه المبيعات (الربح الصافي)</h3>
                    <div style={{ height: '300px' }}>
                        <Line
                            data={{
                                labels: stats.yearly.slice(-6).map(m => m.monthName),
                                datasets: [{
                                    label: 'الربح الصافي',
                                    data: stats.yearly.slice(-6).map(m => m.profit),
                                    borderColor: '#fbbf24',
                                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                    fill: true,
                                    tension: 0.4
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } }
                            }}
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>الأكثر مبيعاً 🔥</h3>
                        <div className="flex gap-xs" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px' }}>
                            {['today', 'week', 'month'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: period === p ? 'var(--accent-gold)' : 'transparent',
                                        color: period === p ? 'white' : 'var(--text-secondary)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {p === 'today' ? 'اليوم' : p === 'week' ? 'إسبوع' : 'شهر'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '300px', position: 'relative' }}>
                        {topLoading && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, borderRadius: '8px' }}>
                                <div className="animate-pulse" style={{ color: 'var(--accent-gold)' }}>جاري التحديث...</div>
                            </div>
                        )}
                        <Doughnut
                            data={{
                                labels: topProducts.map(p => p.productName),
                                datasets: [{
                                    data: topProducts.map(p => p._sum.quantity),
                                    backgroundColor: [
                                        '#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
                                        '#f97316', '#06b6d4', '#ec4899', '#64748b', '#475569'
                                    ],
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Tajawal' } } } }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sections */}
            {renderTimeframeSection('إحصائيات اليوم', today, formatDate(0))}
            {renderTimeframeSection('إحصائيات آخر ٧ أيام', weekly, `${formatDate(7)} - ${formatDate(0)}`)}
            {renderTimeframeSection(`إحصائيات شهر ${currentMonthName}`, monthly, `1 - ${new Date().getDate()} ${currentMonthName}`)}

            {/* Totals Summary */}
            <div className="card" style={{ marginTop: '2rem', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid var(--accent-gold)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>المجموع الكلي (الطلبات المكتملة)</h3>
                <div className="flex" style={{ justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>إجمالي الربح الصافي</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{totals.totalProfit.toLocaleString()} د.ع</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>إجمالي راس المال</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{totals.totalCapital.toLocaleString()} د.ع</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>إجمالي الطلبات</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totals.totalOrders}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
