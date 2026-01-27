import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Truck, PackageCheck, AlertCircle, Printer, MessageCircle, UserPlus, Users, Search, Trash2, ShoppingCart, Heart } from 'lucide-react';
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
        deliveryPaidBy: 'CUSTOMER',
        discount: 0,
        customerId: null,
        orderSource: '',
    });

    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerList, setShowCustomerList] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [redeemedPoints, setRedeemedPoints] = useState(0);

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

    const handleOpenModal = () => {
        setFormData({
            customerName: '',
            customerId: null,
            packagingCost: 0,
            deliveryCost: 0,
            deliveryPaidBy: 'CUSTOMER',
            discount: 0,
            orderSource: '',
        });
        setItems([]); // Reset items for the new order
        setCustomerSearch(''); // Reset customer search
        setRedeemedPoints(0);
        setShowModal(true); // Assuming setIsModalOpen should be setShowModal
    };

    const fetchCustomers = async (search = '') => {
        if (!search) {
            setCustomers([]);
            return;
        }
        try {
            const { data } = await api.get(`/customers?search=${search}`);
            setCustomers(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCustomerSelect = (customer) => {
        setFormData({
            ...formData,
            customerId: customer.id,
            customerName: customer.name
        });
        setCustomerSearch(customer.name);
        setShowCustomerList(false);
    };

    const handleSelectCustomer = (customer) => { // This seems to be a duplicate or alternative to handleCustomerSelect
        setFormData({ ...formData, customerName: customer.name, customerId: customer.id });
        setCustomerSearch(customer.name); // Assuming setSearchTerm should be setCustomerSearch
        setCustomers([]); // Assuming searchResults should be setCustomers
    };

    const handlePointRedemption = (points) => {
        const selectedCustomer = customers.find(c => c.id === formData.customerId);
        if (!selectedCustomer) {
            showToast('الرجاء اختيار عميل أولاً لتطبيق النقاط.', 'info');
            return;
        }

        const maxAvailable = selectedCustomer.points;
        const validPoints = Math.min(Math.max(0, points), maxAvailable);

        setRedeemedPoints(validPoints);
        // 100 points = 1000 IQD discount
        const calculatedDiscount = Math.floor(validPoints / 100) * 1000;
        setFormData({ ...formData, discount: calculatedDiscount });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            showToast('يجب إضافة منتج واحد على الأقل', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                ...formData,
                packagingCost: Number(formData.packagingCost),
                deliveryCost: Number(formData.deliveryCost),
                discount: Number(formData.discount),
                items: items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                redeemedPoints
            };

            await api.post('/orders', orderData);
            showToast('تم إنشاء الطلب بنجاح', 'success');
            setShowModal(false);
            setItems([]);
            setFormData({ customerName: '', packagingCost: 0, deliveryCost: 0, deliveryPaidBy: 'CUSTOMER', discount: 0, customerId: null, orderSource: '' });
            setCustomerSearch('');
            fetchOrders();
            fetchProducts();
        } catch (error) {
            showToast('فشل إنشاء الطلب: ' + (error.response?.data?.message || 'خطأ غير معروف'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        setUpdatingStatusId(id);
        try {
            await api.patch(`/orders/${id}/status`, { status });
            showToast('تم تحديث حالة الطلب', 'success');
            fetchOrders();
        } catch (error) {
            showToast('فشل تحديث الحالة', 'error');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleWhatsAppShare = (order) => {
        const subtotal = order.items.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0);
        const discount = Number(order.discount || 0);
        const deliveryFee = order.deliveryPaidBy === 'CUSTOMER' ? Number(order.deliveryCost) : 0;
        const total = (subtotal - discount) + deliveryFee;

        const itemsText = order.items.map(i => `✨ ${i.productName} (${i.quantity} قطعة)`).join('\n');
        const text = `*اميرتنا ${order.customerName || 'جميلتنا'} - فاتورة مبيعات لوماك كوزمتك*\n\n` +
            `يا هلا بيج ونورتينا.. هذي تفاصيل طلبج الحلو: 🌸\n\n` +
            `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-IQ')}\n\n` +
            `*المحتويات:*\n${itemsText}\n\n` +
            `---------------------------\n` +
            `المجموع: ${subtotal.toLocaleString()} د.ع\n` +
            (discount > 0 ? `الخصم: -${discount.toLocaleString()} د.ع\n` : '') +
            `التوصيل: ${order.deliveryPaidBy === 'SHOP' ? 'مجاني 🎁' : `${Number(order.deliveryCost).toLocaleString()} د.ع`}\n` +
            `*الإجمالي النهائي: ${total.toLocaleString()} د.ع*\n\n` +
            (order.customer?.points !== undefined ? `⭐ رصيد نقاطج الحالي: ${order.customer.points} نقطة\n` +
                `🎁 تكدرين تستخدمين نقاطج كخصم مباشر أو توصيل مجاني بطلباتج الجاية.. ننتظرج دائماً ✨\n\n` : '') +
            `تتهنين بيهم يا رب وشكراً لاختيارج لوماك كوزمتك ✨`;

        // Improved Phone Cleaning logic
        let phone = order.customer?.phone || '';
        phone = phone.replace(/[^\d]/g, ''); // Remove any non-digits (spaces, dashes, etc.)

        if (phone) {
            if (phone.startsWith('0')) {
                phone = '964' + phone.substring(1);
            } else if (!phone.startsWith('964')) {
                phone = '964' + phone;
            }

            // For direct chat, many browsers/apps respond better to this format
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        } else {
            // Fallback for Guest orders or orders without a registered phone
            showToast('هذا الطلب غير مرتبط برقم هاتف مسجل. سيتم فتح الواتساب للمشاركة العامة.', 'info');
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    const handleSendFeedback = (order) => {
        const text = `*جميلتنا ${order.customerName || ''}.. اشتاقينا لج!* ✨🌸\n\n` +
            `يا رب تكونين تتهنين بطلبج الأخير من لوماك.. حابين نعرف رأيج بالمنتجات؟ 😍\n\n` +
            `رضاج هو هدفنا، وإذا عندج أي ملاحظة أو صورة حلوة للمنتجات لا تترددين تشاركينا بيهه.. كلش نفرح برأيج!\n\n` +
            `شكراً لثقتج بينا دائماً.. ننتظرج بطلبات جاية أحلى ✨💖`;

        let phone = order.customer?.phone || '';
        phone = phone.replace(/[^\d]/g, '');

        if (phone) {
            if (phone.startsWith('0')) phone = '964' + phone.substring(1);
            else if (!phone.startsWith('964')) phone = '964' + phone;

            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        } else {
            showToast('هذا الطلب غير مرتبط برقم هاتف مسجل.', 'info');
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
        const discount = Number(order.discount || 0);
        const deliveryFee = order.deliveryPaidBy === 'CUSTOMER' ? Number(order.deliveryCost) : 0;
        const total = (subtotal - discount) + deliveryFee;

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>Lumaq Cosmetics - Invoice</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
                    body { 
                        font-family: 'Tajawal', sans-serif; 
                        padding: 30px; 
                        color: #4a1d1f; 
                        background: #fff; 
                        margin: 0;
                    }
                    .container { 
                        max-width: 700px; 
                        margin: 0 auto; 
                        border: 2px solid #fbcfe8; 
                        padding: 40px; 
                        border-radius: 20px; 
                        background: #fff;
                        position: relative;
                        overflow: hidden;
                    }
                    .container::before {
                        content: "";
                        position: absolute;
                        top: 0; right: 0;
                        width: 150px; height: 150px;
                        background: radial-gradient(circle, #fdf2f8 0%, rgba(255,255,255,0) 70%);
                        z-index: 0;
                    }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        border-bottom: 2px dashed #fbcfe8; 
                        padding-bottom: 25px; 
                        margin-bottom: 30px; 
                        position: relative;
                        z-index: 1;
                    }
                    .logo-section { text-align: right; }
                    .logo { font-size: 2.8rem; font-weight: 700; color: #db2777; margin: 0; }
                    .tagline { color: #f472b6; font-size: 0.9rem; margin-top: -5px; }
                    
                    .invoice-info { text-align: left; }
                    .invoice-title { font-size: 1.8rem; font-weight: 700; color: #db2777; margin-bottom: 5px; }
                    .invoice-meta { color: #9d174d; font-size: 0.9rem; }

                    .customer-card { 
                        background: #fdf2f8; 
                        padding: 20px; 
                        border-radius: 12px; 
                        margin-bottom: 30px;
                        border-right: 5px solid #db2777;
                    }
                    .customer-label { color: #be185d; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
                    .customer-name { font-size: 1.4rem; color: #4a1d1f; font-weight: 700; margin: 0; }

                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 1; }
                    th { 
                        text-align: right; 
                        padding: 15px; 
                        color: #db2777; 
                        font-weight: 700; 
                        border-bottom: 2px solid #fbcfe8; 
                        font-size: 1rem;
                    }
                    td { padding: 15px; border-bottom: 1px solid #fce7f3; color: #4a1d1f; }
                    
                    .totals-section { 
                        display: flex; 
                        justify-content: flex-end; 
                        margin-top: 20px; 
                    }
                    .totals-box { width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; color: #701a75; }
                    .final-total { 
                        border-top: 2px solid #db2777; 
                        padding-top: 15px; 
                        margin-top: 10px; 
                        font-size: 1.6rem; 
                        font-weight: 700; 
                        color: #db2777; 
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #fce7f3;
                        color: #f472b6;
                        font-style: italic;
                    }
                    .hearts { color: #db2777; font-size: 1.2rem; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo-section">
                            <h1 class="logo">لوماك كوزمتك</h1>
                            <p class="tagline">لأنكِ تستحقين الدلال..</p>
                        </div>
                        <div class="invoice-info">
                            <div class="invoice-title">فاتورة الجمال</div>
                            <div class="invoice-meta">رقم: #${order.orderNumber.split('-')[0]}</div>
                            <div class="invoice-meta">${new Date(order.createdAt).toLocaleDateString('ar-IQ')}</div>
                        </div>
                    </div>

                    <div class="customer-card">
                        <div class="customer-label">إلى أميرتنا الرقيقة:</div>
                        <p class="customer-name">${order.customerName || 'جميلتنا الرائعة'}</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th style="text-align: center;">الكمية</th>
                                <th style="text-align: left;">السعر</th>
                                <th style="text-align: left;">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>

                    <div class="totals-section">
                        <div class="totals-box">
                            <div class="total-row"><span>المجموع:</span> <span>${subtotal.toLocaleString()} د.ع</span></div>
                            ${discount > 0 ? `<div class="total-row" style="color: #db2777;"><span>خصم خاص لج:</span> <span>-${discount.toLocaleString()} د.ع</span></div>` : ''}
                            <div class="total-row"><span>توصيل لعنوانج:</span> <span>${order.deliveryPaidBy === 'SHOP' ? 'مجاني 🎁' : `${Number(order.deliveryCost).toLocaleString()} د.ع`}</span></div>
                            <div class="total-row final-total"><span>الإجمالي:</span> <span>${total.toLocaleString()} د.ع</span></div>
                        </div>
                    </div>

                    ${order.customer?.points !== undefined ? `
                    <div style="background: #fdf2f8; padding: 15px; border-radius: 12px; margin-top: 20px; border: 1px dashed #fbcfe8; text-align: center;">
                        <div style="color: #db2777; font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">✨ محفظة رصيدج: ${order.customer.points} نقطة</div>
                        <div style="color: #f472b6; font-size: 0.85rem;">تكدرين تستخدمين نقاطج كخصم مباشر أو توصيل مجاني بطلباتج الجاية! 💖</div>
                    </div>
                    ` : ''}

                    <div class="footer">
                        تتهنين بطلبيج يا حلوه.. شكراً لثقتج بينا <span class="hearts">♥ ✨</span>
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

    const totalSellingBeforeDiscount = items.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0);
    const discountValue = Number(formData.discount) || 0;
    const totalSellingAfterDiscount = totalSellingBeforeDiscount - discountValue;

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
                                                        <button onClick={() => handlePrint(order)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0 }} title="طباعة">
                                                            <Printer size={14} />
                                                        </button>
                                                        <button onClick={() => handleWhatsAppShare(order)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0, color: '#25D366', borderColor: '#25D366' }} title="واتساب">
                                                            <MessageCircle size={14} />
                                                        </button>
                                                        {order.status === 'NEW' && (
                                                            <div className="flex gap-sm">
                                                                <button
                                                                    onClick={() => updateStatus(order.id, 'SHIPPED')}
                                                                    className="btn btn-outline"
                                                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                                                    disabled={updatingStatusId === order.id}
                                                                >
                                                                    {updatingStatusId === order.id ? 'جاري...' : 'شحن'}
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus(order.id, 'CANCELLED')}
                                                                    className="btn btn-outline"
                                                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                                                                    disabled={updatingStatusId === order.id}
                                                                >
                                                                    إلغاء
                                                                </button>
                                                            </div>
                                                        )}
                                                        {order.status === 'SHIPPED' && (
                                                            <div className="flex gap-sm">
                                                                <button
                                                                    onClick={() => updateStatus(order.id, 'COMPLETED')}
                                                                    className="btn btn-primary"
                                                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'var(--accent-green)' }}
                                                                    disabled={updatingStatusId === order.id}
                                                                >
                                                                    {updatingStatusId === order.id ? '...' : 'تم'}
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus(order.id, 'RETURNED')}
                                                                    className="btn btn-outline"
                                                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                                                                    disabled={updatingStatusId === order.id}
                                                                >
                                                                    راجع
                                                                </button>
                                                            </div>
                                                        )}
                                                        {order.status === 'COMPLETED' && (
                                                            (() => {
                                                                const completedDate = new Date(order.completedAt || order.updatedAt);
                                                                const daysDiff = (new Date() - completedDate) / (1000 * 60 * 60 * 24);
                                                                if (daysDiff >= 2) {
                                                                    return (
                                                                        <button
                                                                            onClick={() => handleSendFeedback(order)}
                                                                            className="btn btn-outline flex-center"
                                                                            style={{ gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
                                                                        >
                                                                            <Heart size={12} fill="var(--accent-gold)" />
                                                                            تقييم
                                                                        </button>
                                                                    );
                                                                }
                                                                return null;
                                                            })()
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
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>اسم الزبون / رقم الهاتف</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="ابحث عن زبون أو اكتب اسماً جديداً..."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setFormData({ ...formData, customerName: e.target.value, customerId: null });
                                    fetchCustomers(e.target.value);
                                    setShowCustomerList(true);
                                }}
                                onFocus={() => setShowCustomerList(true)}
                            />
                            {showCustomerList && customers.length > 0 && (
                                <div className="card" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    marginTop: '0.25rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    padding: '0.5rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    {customers.map(c => (
                                        <div
                                            key={c.id}
                                            className="flex"
                                            style={{
                                                padding: '0.75rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--glass-border)',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                            onClick={() => handleCustomerSelect(c)}
                                        >
                                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                                <Users size={14} color="var(--accent-gold)" />
                                                <div className="flex flex-col">
                                                    <span>{c.name || (c.instagram ? `@${c.instagram}` : 'زبون بلا اسم')}</span>
                                                    {c.name && c.instagram && <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>@{c.instagram}</span>}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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

                    {formData.customerId && (
                        <div style={{
                            background: 'rgba(219, 39, 119, 0.05)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed #fbcfe8',
                            marginBottom: '1rem'
                        }}>
                            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#db2777', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    ✨ محفظة النقاط
                                </span>
                                <span style={{ fontSize: '0.9rem' }}>
                                    الرصيد: {customers.find(c => c.id === formData.customerId)?.points || 0} نقطة
                                </span>
                            </div>
                            <div className="flex gap-md" style={{ alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>النقاط للمقايضة (100 نقطة = 1000 د.ع)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={redeemedPoints}
                                        onChange={(e) => handlePointRedemption(parseInt(e.target.value) || 0)}
                                        step="100"
                                        min="0"
                                    />
                                </div>
                                <div style={{ minWidth: '120px', textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>توفير الجمال:</div>
                                    <div style={{ color: '#db2777', fontWeight: 'bold' }}>{((Math.floor(redeemedPoints / 100)) * 1000).toLocaleString()} د.ع</div>
                                </div>
                            </div>
                            {formData.deliveryCost > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{
                                        marginTop: '0.5rem',
                                        width: '100%',
                                        fontSize: '0.8rem',
                                        padding: '0.4rem',
                                        color: '#db2777',
                                        borderColor: '#db2777'
                                    }}
                                    onClick={() => {
                                        const pointsNeeded = (formData.deliveryCost / 1000) * 100;
                                        handlePointRedemption(pointsNeeded);
                                        setFormData({ ...formData, deliveryPaidBy: 'SHOP' });
                                    }}
                                >
                                    🎁 استخدام النقاط للتوصيل المجاني ({(formData.deliveryCost / 1000) * 100} نقطة)
                                </button>
                            )}
                        </div>
                    )}

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
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>خصم (د.ع)</label>
                            <input type="number" className="input" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} min="0" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>التوصيل على:</label>
                            <select className="input" value={formData.deliveryPaidBy} onChange={(e) => setFormData({ ...formData, deliveryPaidBy: e.target.value })}>
                                <option value="CUSTOMER">الزبون</option>
                                <option value="SHOP">المتجر (مجاني)</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>مصدر الطلب</label>
                            <select
                                className="input"
                                value={formData.orderSource}
                                onChange={(e) => setFormData({ ...formData, orderSource: e.target.value })}
                            >
                                <option value="">اختر المصدر...</option>
                                <option value="INSTAGRAM">انستجرام</option>
                                <option value="TIKTOK">تيك توك</option>
                                <option value="WHATSAPP">واتساب</option>
                                <option value="FACEBOOK">فيسبوك</option>
                                <option value="SNAPCHAT">سناب شات</option>
                                <option value="OFFLINE">مباشر / محل</option>
                            </select>
                        </div>
                    </div>
                    {totalSellingBeforeDiscount > 0 && (
                        <div className="flex" style={{ justifyContent: 'space-between', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>المجموع قبل الخصم:</div>
                                <div style={{ fontWeight: 'bold' }}>{totalSellingBeforeDiscount.toLocaleString()} د.ع</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>المبلغ الصافي:</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', fontSize: '1.2rem' }}>{totalSellingAfterDiscount.toLocaleString()} د.ع</div>
                            </div>
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ الطلب'}
                    </button>
                </form>
            </Modal>
        </div >
    );
};

export default Orders;
