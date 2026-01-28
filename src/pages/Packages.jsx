import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Edit, Gift, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Packages = () => {
    const { showToast } = useToast();
    const [packages, setPackages] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // Edit mode not fully implemented in backend yet for deep update, so we might restrict to Create/Delete for now or just generic update
    // Actually package update is complex (updating relations). Let's stick to Create/Delete for MVP or simple name/price update?
    // The plan said "Implement createPackage... updatePackage". I only did basic skeleton. 
    // Let's implement Create and Delete first.

    const [formData, setFormData] = useState({
        name: '',
        sellingPrice: '',
        items: [{ productId: '', quantity: 1 }]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPackages();
        fetchProducts();
    }, []);

    const fetchPackages = async () => {
        try {
            const { data } = await api.get('/packages');
            setPackages(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            name: '',
            sellingPrice: '',
            items: [{ productId: '', quantity: 1 }]
        });
        setShowModal(true);
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1 }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.sellingPrice || formData.items.some(i => !i.productId || i.quantity < 1)) {
            showToast('يرجى ملء جميع الحقول بشكل صحيح', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                sellingPrice: Number(formData.sellingPrice),
                items: formData.items.map(i => ({
                    productId: Number(i.productId),
                    quantity: Number(i.quantity)
                }))
            };

            await api.post('/packages', payload);
            showToast('تم إنشاء البكج بنجاح', 'success');
            setShowModal(false);
            fetchPackages();
        } catch (error) {
            const msg = error.response?.data?.message || 'فشل إنشاء البكج';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا البكج؟')) return;
        try {
            await api.delete(`/packages/${id}`);
            showToast('تم حذف البكج', 'success');
            fetchPackages();
        } catch (error) {
            showToast('فشل حذف البكج', 'error');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة البكجات</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={handleOpenModal}>
                    <Plus size={20} />
                    إنشاء بكج جديد
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>اسم البكج</th>
                            <th style={{ padding: '1rem' }}>سعر البكج</th>
                            <th style={{ padding: '1rem' }}>محتويات البكج</th>
                            <th style={{ padding: '1rem' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</td></tr>
                        ) : packages.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>لا توجد بكجات حالياً</td></tr>
                        ) : (
                            packages.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Gift size={16} color="var(--accent-gold)" />
                                        {p.name}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                                        {Number(p.sellingPrice).toLocaleString()} د.ع
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="flex flex-col gap-xs">
                                            {p.items?.map((item, idx) => (
                                                <span key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {item.quantity}x {item.product?.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleDelete(p.id)}
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إنشاء بكج جديد">
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>اسم البكج</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="مثال: بكج العيد"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>سعر بيع البكج (د.ع)</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.sellingPrice}
                            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                            placeholder="15000"
                            required
                            min="0"
                        />
                        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            هذا السعر مستقل عن مجموع أسعار المنتجات الفردية
                        </small>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>محتويات البكج</label>
                        <div className="flex flex-col gap-sm">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex gap-sm items-center">
                                    <select
                                        className="input"
                                        style={{ flex: 2 }}
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                        required
                                    >
                                        <option value="">اختر منتج...</option>
                                        {products.map(prod => (
                                            <option key={prod.id} value={prod.id}>
                                                {prod.name} (مخزون: {prod.stock})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        className="input"
                                        style={{ flex: 1 }}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        min="1"
                                        placeholder="العدد"
                                        required
                                    />
                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="btn"
                                style={{ background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', border: '1px dashed var(--glass-border)' }}
                            >
                                + إضافة منتج آخر للبكج
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : 'إنشاء البكج'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Packages;
