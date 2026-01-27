import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Trash2, PieChart, Target } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Expenses = () => {
    const { showToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        type: 'ADS',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [roiData, setRoiData] = useState([]);
    const [breakdownData, setBreakdownData] = useState([]);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
    const expenseTypes = {
        ADS: { label: 'إعلانات', color: 'var(--accent-purple)' },
        GOODS: { label: 'شراء بضاعة', color: 'var(--accent-blue)' },
        PACKAGING: { label: 'تغليف', color: 'var(--accent-gold)' },
        TRANSPORT: { label: 'نقل وتوصيل', color: 'var(--accent-red)' },
        EXTRA: { label: 'مصاريف إضافية', color: 'var(--text-secondary)' }
    };

    useEffect(() => {
        fetchExpenses();
        fetchAnalytics();
    }, []);

    const fetchExpenses = async () => {
        try {
            const { data } = await api.get('/expenses');
            setExpenses(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const [roiRes, breakRes] = await Promise.all([
                api.get('/reports/roi'),
                api.get('/reports/expenses/breakdown')
            ]);
            setRoiData(roiRes.data.data);
            setBreakdownData(breakRes.data.data);
        } catch (error) {
            console.error('Analytics Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/expenses', formData);
            showToast('تمت إضافة المصروف بنجاح', 'success');
            setShowModal(false);
            setFormData({ type: 'ADS', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchExpenses();
        } catch (error) {
            showToast('فشل إضافة المصروف', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من الحذف؟')) {
            setDeletingId(id);
            try {
                await api.delete(`/expenses/${id}`);
                showToast('تم حذف المصروف بنجاح', 'info');
                fetchExpenses();
            } catch (error) {
                showToast('فشل الحذف (قد لا تملك الصلاحية)', 'error');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = expenses.filter(exp =>
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expenseTypes[exp.type]?.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const expensesByCategory = expenses.reduce((acc, exp) => {
        const type = exp.type;
        acc[type] = (acc[type] || 0) + Number(exp.amount);
        return acc;
    }, {});

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة المــصاريف</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    إضافة مصروف
                </button>
            </div>

            <div className="flex" style={{ gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'list' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'list' ? '2px solid var(--accent-gold)' : 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    قائمة المصاريف
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'analytics' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'analytics' ? '2px solid var(--accent-gold)' : 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    تحليلات المصاريف والـ ROI
                </button>
            </div>

            {activeTab === 'analytics' ? (
                <div className="flex flex-col gap-lg">
                    {/* Expense Breakdown */}
                    <div className="card">
                        <div className="flex-center" style={{ gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <PieChart size={20} className="text-accent-blue" />
                            <h3 style={{ margin: 0 }}>توزيع المصاريف (شهرياً)</h3>
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {breakdownData.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>لا توجد بيانات كافية</p>
                            ) : (
                                breakdownData.map(monthData => (
                                    <div key={monthData.monthKey} className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                                        <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>{monthData.monthName}</h4>
                                            <span style={{ fontWeight: 'bold' }}>{monthData.total.toLocaleString()} د.ع</span>
                                        </div>
                                        <div className="flex flex-col gap-sm">
                                            {monthData.breakdown.map(item => (
                                                <div key={item.type} className="flex-between" style={{ fontSize: '0.9rem' }}>
                                                    <span style={{ color: expenseTypes[item.type]?.color }}> {expenseTypes[item.type]?.label} </span>
                                                    <span>{item.total.toLocaleString()} د.ع</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Marketing ROI */}
                    <div className="card">
                        <div className="flex-center" style={{ gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Target size={20} className="text-accent-gold" />
                            <h3 style={{ margin: 0 }}>تحليل مصادر الطلبات (ROI)</h3>
                        </div>
                        <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '0.5rem' }}>المصدر</th>
                                    <th style={{ padding: '0.5rem' }}>الطلبات</th>
                                    <th style={{ padding: '0.5rem' }}>الإيرادات</th>
                                    <th style={{ padding: '0.5rem' }}>الأرباح</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roiData.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item.source}</td>
                                        <td style={{ padding: '0.75rem' }}>{item.orderCount}</td>
                                        <td style={{ padding: '0.75rem' }}>{item.revenue.toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-blue)' }}>{item.profit.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {Object.entries(expenseTypes).map(([key, val]) => (
                            <div key={key} className="card" style={{ padding: '1.25rem', borderRight: `4px solid ${val.color}` }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{val.label}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    {(expensesByCategory[key] || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>د.ع</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                        <input
                            type="text"
                            placeholder="ابحث في المصاريف..."
                            className="input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ maxWidth: '400px' }}
                        />
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>النوع</th>
                                    <th style={{ padding: '1rem' }}>المبلغ</th>
                                    <th style={{ padding: '1rem' }}>التاريخ</th>
                                    <th style={{ padding: '1rem' }}>الوصف</th>
                                    <th style={{ padding: '1rem' }}>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</td></tr>
                                ) : filteredExpenses.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>لا توجد مصاريف تطابق البحث</td></tr>
                                ) : (
                                    filteredExpenses.map((expense) => (
                                        <tr key={expense.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '99px',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: expenseTypes[expense.type]?.color || 'white',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {expenseTypes[expense.type]?.label || expense.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{Number(expense.amount).toLocaleString()} د.ع</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                {new Date(expense.date).toLocaleDateString('ar-IQ')}
                                            </td>
                                            <td style={{ padding: '1rem', maxWidth: '300px' }}>{expense.description || '-'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', opacity: deletingId === expense.id ? 0.5 : 1 }}
                                                    disabled={deletingId === expense.id}
                                                >
                                                    {deletingId === expense.id ? '...' : <Trash2 size={18} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة مصروف جديد">
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>نوع المصروف</label>
                        <select
                            className="input"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            {Object.entries(expenseTypes).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>المبلغ (د.ع)</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                            min="0"
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>التاريخ</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>الوصف</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;
