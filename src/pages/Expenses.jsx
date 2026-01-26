import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Trash2 } from 'lucide-react';
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

    const expenseTypes = {
        ADS: { label: 'إعلانات', color: 'var(--accent-purple)' },
        GOODS: { label: 'شراء بضاعة', color: 'var(--accent-blue)' },
        PACKAGING: { label: 'تغليف', color: 'var(--accent-gold)' },
        EXTRA: { label: 'مصاريف إضافية', color: 'var(--accent-red)' }
    };

    useEffect(() => {
        fetchExpenses();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', formData);
            showToast('تمت إضافة المصروف بنجاح', 'success');
            setShowModal(false);
            setFormData({ type: 'ADS', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchExpenses();
        } catch (error) {
            showToast('فشل إضافة المصروف', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من الحذف؟')) {
            try {
                await api.delete(`/expenses/${id}`);
                showToast('تم حذف المصروف بنجاح', 'info');
                fetchExpenses();
            } catch (error) {
                showToast('فشل الحذف (قد لا تملك الصلاحية)', 'error');
            }
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = expenses.filter(exp =>
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expenseTypes[exp.type]?.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة المــصاريف</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    إضافة مصروف
                </button>
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
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>حفظ</button>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;
