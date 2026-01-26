import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Orders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    // Form State
    const [items, setItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({ productId: '', quantity: 1 });
    const [formData, setFormData] = useState({
        customerName: '',
        packagingCost: 0,
        deliveryCost: 0,
        deliveryPaidBy: 'CUSTOMER'
    });

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data.data);
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

    const addItem = () => {
        if (!currentItem.productId) return;
        const product = products.find(p => p.id === Number(currentItem.productId));
        if (!product) return;

        if (product.stock < Number(currentItem.quantity)) {
            showToast(`الكمية المتوفرة غير كافية لـ ${product.name}. المتوفر: ${product.stock}`, 'error');
            return;
        }

        setItems([...items, { ...product, quantity: Number(currentItem.quantity) }]);
        setCurrentItem({ productId: '', quantity: 1 });
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            showToast('يجب إضافة منتج واحد على الأقل', 'error');
            return;
        }

        try {
            const payload = {
                customerName: formData.customerName,
                packagingCost: Number(formData.packagingCost),
                deliveryCost: Number(formData.deliveryCost),
                deliveryPaidBy: formData.deliveryPaidBy,
                items: items.map(i => ({
                    productId: i.id,
                    quantity: i.quantity
                }))
            };

            await api.post('/orders', payload);
            showToast('تم إنشاء الطلب بنجاح', 'success');
            setShowModal(false);
            setItems([]);
            setFormData({ customerName: '', packagingCost: 0, deliveryCost: 0, deliveryPaidBy: 'CUSTOMER' });
            fetchOrders();
            fetchProducts();
        } catch (error) {
            showToast('فشل إنشاء الطلب: ' + (error.response?.data?.message || 'خطأ غير معروف'), 'error');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/orders/${id}/status`, { status });
            showToast('تم تحديث حالة الطلب', 'success');
            fetchOrders();
        } catch (error) {
            showToast('فشل تحديث الحالة', 'error');
        }
    };

    const statusConfig = {
        NEW: { label: 'جديد', color: 'var(--accent-blue)', icon: AlertCircle },
        SHIPPED: { label: 'تم الشحن', color: 'var(--accent-purple)', icon: Truck },
        COMPLETED: { label: 'مكتمل', color: 'var(--accent-green)', icon: CheckCircle },
        CANCELLED: { label: 'ملغي', color: 'var(--accent-red)', icon: PackageCheck },
        RETURNED: { label: 'راجع', color: 'var(--accent-red)', icon: AlertCircle },
    };

    const handlePrint = (order) => {
        const printWindow = window.open('', '_blank');
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">${Number(item.sellingPrice).toLocaleString()} د.ع</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">${(Number(item.sellingPrice) * item.quantity).toLocaleString()} د.ع</td>
            </tr>
        `).join('');

        const subtotal = order.items.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0);

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>Lumaq Cosmetics - Invoice</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                    body { font-family: 'Tajawal', sans-serif; padding: 50px; color: #1e293b; background: #fff; }
                    .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 8px; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #fbbf24; padding-bottom: 20px; margin-bottom: 40px; }
                    .logo { font-size: 2.5rem; font-weight: 700; color: #fbbf24; }
                    .invoice-info { text-align: left; }
                    .customer-info { margin-bottom: 40px; }
                    .customer-info h3 { margin-bottom: 10px; color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
                    .customer-info p { font-size: 1.2rem; margin: 0; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { text-align: right; background: #f8fafc; padding: 12px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
                    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
                    .total-row { display: flex; justify-content: space-between; width: 300px; padding: 5px 0; }
                    .final-total { border-top: 2px solid #fbbf24; padding-top: 15px; margin-top: 10px; font-size: 1.4rem; font-weight: 700; color: #fbbf24; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">لوماك كوزمتك</div>
                        <div class="invoice-info">
                            <div style="font-size: 1.5rem; font-weight: 700;">فاتورة مبيعات</div>
                            <div style="color: #64748b;">رقم: #${order.orderNumber.split('-')[0]}</div>
                            <div style="color: #64748b;">${new Date(order.createdAt).toLocaleDateString('ar-IQ')}</div>
                        </div>
                    </div>
                    <div class="customer-info">
                        <h3>اسم الزبون:</h3>
                        <p>${order.customerName || 'زبون عام'}</p>
                    </div>
                    <table>
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th>المنتج</th>
                                <th style="text-align: center;">الكمية</th>
                                <th style="text-align: left;">السعر</th>
                                <th style="text-align: left;">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div class="totals">
                        <div class="total-row"><span>المجموع الفرعي:</span> <span>${subtotal.toLocaleString()} د.ع</span></div>
                        <div class="total-row"><span>تكلفة التوصيل:</span> <span>${Number(order.deliveryCost).toLocaleString()} د.ع</span></div>
                        <div class="total-row final-total"><span>الإجمالي:</span> <span>${Number(subtotal + (order.deliveryPaidBy === 'CUSTOMER' ? Number(order.deliveryCost) : 0)).toLocaleString()} د.ع</span></div>
                    </div>
                </div>
                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !selectedDate || new Date(order.createdAt).toISOString().split('T')[0] === selectedDate;
        return matchesSearch && matchesDate;
    });

    const groupedOrders = filteredOrders.reduce((groups, order) => {
        const date = new Date(order.createdAt).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(order);
        return groups;
    }, {});

    const totalSelling = items.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0);

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة الـطلبات</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    إنشاء طلب جديد
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div className="flex gap-md" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="ابحث عن طلب..."
                            className="input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>تصفية حسب التاريخ:</span>
                        <input
                            type="date"
                            className="input"
                            style={{ width: 'auto' }}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>لا توجد طلبات تطابق الاختيارات</div>
            ) : (
                Object.entries(groupedOrders).map(([date, dayOrders]) => (
                    <div key={date} style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-gold)' }}></div>
                            {date}
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({dayOrders.length} طلبات)</span>
                        </h3>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>رقم الطلب</th>
                                        <th style={{ padding: '1rem' }}>الزبون</th>
                                        <th style={{ padding: '1rem' }}>القيمة</th>
                                        <th style={{ padding: '1rem' }}>الربح</th>
                                        <th style={{ padding: '1rem' }}>الحالة</th>
                                        <th style={{ padding: '1rem' }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayOrders.map((order) => {
                                        const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
                                        return (
                                            <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>#{order.orderNumber.split('-')[0]}</td>
                                                <td style={{ padding: '1rem' }}>{order.customerName || 'زائر'}</td>
                                                <td style={{ padding: '1rem' }}>{Number(order.totalSellingPrice).toLocaleString()} د.ع</td>
                                                <td style={{ padding: '1rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                                                    {Number(order.totalProfit).toLocaleString()} د.ع
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                        color: statusConfig[order.status]?.color,
                                                        background: 'rgba(255,255,255,0.05)',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px'
                                                    }}>
                                                        <StatusIcon size={14} />
                                                        {statusConfig[order.status]?.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div className="flex gap-sm">
                                                        <button onClick={() => handlePrint(order)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>طبع</button>
                                                        {order.status === 'NEW' && <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>شحن</button>}
                                                        {order.status === 'SHIPPED' && (
                                                            <div className="flex gap-sm">
                                                                <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'var(--accent-green)' }}>تم الاستلام</button>
                                                                <button onClick={() => updateStatus(order.id, 'RETURNED')} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>راجع</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إنشاء طلب جديد">
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>اسم الزبون</label>
                        <input type="text" className="input" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>إضافة منتجات</h4>
                        <div className="flex gap-sm" style={{ alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>المنتج</label>
                                <select className="input" value={currentItem.productId} onChange={(e) => setCurrentItem({ ...currentItem, productId: e.target.value })}>
                                    <option value="">اختر منتج...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                            {p.name} ({p.stock > 0 ? `${Number(p.sellingPrice).toLocaleString()} - المتوفر: ${p.stock}` : 'نفذ الكمية'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ width: '80px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>الكمية</label>
                                <input type="number" className="input" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })} />
                            </div>
                            <button type="button" onClick={addItem} className="btn btn-primary" style={{ height: '42px', width: '42px', padding: 0 }}><Plus size={20} /></button>
                        </div>
                        {items.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                {items.map((item, index) => (
                                    <div key={index} className="flex" style={{ justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <span>{item.name} (x{item.quantity})</span>
                                        <div className="flex" style={{ gap: '1rem' }}>
                                            <span>{(item.sellingPrice * item.quantity).toLocaleString()} د.ع</span>
                                            <button type="button" onClick={() => removeItem(index)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none' }}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-md" style={{ alignItems: 'flex-end' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>التغليف</label>
                            <input type="number" className="input" value={formData.packagingCost} onChange={(e) => setFormData({ ...formData, packagingCost: e.target.value })} min="0" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>التوصيل</label>
                            <input type="number" className="input" value={formData.deliveryCost} onChange={(e) => setFormData({ ...formData, deliveryCost: e.target.value })} min="0" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>التوصيل على:</label>
                            <select className="input" value={formData.deliveryPaidBy} onChange={(e) => setFormData({ ...formData, deliveryPaidBy: e.target.value })}>
                                <option value="CUSTOMER">الزبون</option>
                                <option value="SHOP">المتجر (مجاني)</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>حفظ الطلب</button>
                </form>
            </Modal>
        </div>
    );
};

export default Orders;
