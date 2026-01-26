import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

const Reports = () => {
    const [yearlyStats, setYearlyStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchYearlyStats();
    }, [selectedYear]);

    const fetchYearlyStats = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reports/yearly?year=${selectedYear}`);
            setYearlyStats(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const currentMonthIndex = new Date().getMonth();

    if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>;

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>التقارير السنوية</h1>
                <select
                    className="input"
                    style={{ width: 'auto' }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {yearlyStats.map((stat, index) => {
                    const isFuture = selectedYear === new Date().getFullYear() && (stat.month - 1) > currentMonthIndex;
                    if (stat.orderCount === 0 && isFuture) return null;

                    return (
                        <div key={stat.month} className="card" style={{
                            padding: '1.5rem',
                            borderRight: index === currentMonthIndex ? '5px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                            opacity: isFuture ? 0.5 : 1
                        }}>
                            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div className="flex" style={{ alignItems: 'center', gap: '0.75rem' }}>
                                    <Calendar className="text-gold" size={24} />
                                    <h3 style={{ margin: 0 }}>{stat.monthName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({stat.enMonthName})</span></h3>
                                </div>
                                {index === currentMonthIndex && (
                                    <span style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent-gold)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>الشهر الحالي</span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>الربح الصافي</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stat.profit.toLocaleString()} د.ع</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>راس المال</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{stat.capital.toLocaleString()} د.ع</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>المصاريف</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>{stat.expenses.toLocaleString()} د.ع</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>الإيرادات</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stat.revenue.toLocaleString()} د.ع</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>الطلبات</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stat.orderCount}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Reports;
