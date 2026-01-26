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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/reports/dashboard');
            setStats(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
        <div className="animate-fade-in">
            <h1 style={{ marginBottom: '2.5rem' }}>التحليل الـمالي</h1>

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
