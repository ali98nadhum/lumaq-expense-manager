import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Edit, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Products = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        costPrice: '',
        sellingPrice: '',
        supplier: '',
        stock: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditMode(true);
            setFormData({
                id: product.id,
                name: product.name,
                costPrice: product.costPrice,
                sellingPrice: product.sellingPrice,
                supplier: product.supplier || '',
                stock: product.stock
            });
        } else {
            setEditMode(false);
            setFormData({ id: null, name: '', costPrice: '', sellingPrice: '', supplier: '', stock: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/products/${formData.id}`, formData);
                showToast('تم تحديث المنتج بنجاح', 'success');
            } else {
                await api.post('/products', formData);
                showToast('تمت إضافة المنتج بنجاح', 'success');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            showToast('فشل حفظ المنتج', 'error');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة المنتجات</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    إضافة منتج
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <input
                    type="text"
                    placeholder="ابحث عن منتج..."
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
                            <th style={{ padding: '1rem' }}>اسم المنتج</th>
                            <th style={{ padding: '1rem' }}>سعر التكلفة</th>
                            <th style={{ padding: '1rem' }}>سعر البيع</th>
                            <th style={{ padding: '1rem' }}>هامش الربح</th>
                            <th style={{ padding: '1rem' }}>الكمية</th>
                            <th style={{ padding: '1rem' }}>المورد</th>
                            <th style={{ padding: '1rem' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>لا توجد منتجات تطابق البحث</td></tr>
                        ) : (
                            filteredProducts.map((p) => {
                                const profit = Number(p.sellingPrice) - Number(p.costPrice);
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={16} color="var(--accent-gold)" />
                                            {p.name}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{Number(p.costPrice).toLocaleString()} د.ع</td>
                                        <td style={{ padding: '1rem' }}>{Number(p.sellingPrice).toLocaleString()} د.ع</td>
                                        <td style={{ padding: '1rem', color: profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                            {profit.toLocaleString()} د.ع
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {p.stock > 0 ? (
                                                <span style={{ color: p.stock < 5 ? 'var(--accent-gold)' : 'inherit' }}>{p.stock} قطعة</span>
                                            ) : (
                                                <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>نفذت الكمية</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{p.supplier || '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(p)}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer' }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? "تعديل منتج" : "إضافة منتج جديد"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>اسم المنتج</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex gap-md">
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>سعر التكلفة</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>سعر البيع</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.sellingPrice}
                                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-md">
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>المورد (اختياري)</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>الكمية المتوفرة</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>حفظ</button>
                </form>
            </Modal>
        </div>
    );
};

export default Products;
