import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Truck, PackageCheck, AlertCircle, Printer, MessageCircle, UserPlus, Users, Search, Trash2, ShoppingCart, Heart, Gift, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Orders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    // Form State
    const [items, setItems] = useState([]);
    // currentItemType: 'PRODUCT' | 'PACKAGE'
    const [currentItemType, setCurrentItemType] = useState('PRODUCT');
    const [currentItem, setCurrentItem] = useState({ id: '', quantity: 1, isFree: false });

    const [formData, setFormData] = useState({
        customerName: '',
        packagingCost: 0,
        deliveryCost: 0,
        deliveryPaidBy: 'CUSTOMER',
        discount: 0,
        discountType: 'AMOUNT', // AMOUNT or PERCENTAGE
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
        fetchPackages();
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

    const fetchPackages = async () => {
        try {
            const { data } = await api.get('/packages');
            setPackages(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = () => {
        if (!currentItem.id) return;

        let newItem = {
            quantity: Number(currentItem.quantity),
            isFree: currentItem.isFree,
            type: currentItemType
        };

        if (currentItemType === 'PRODUCT') {
            const product = products.find(p => p.id === Number(currentItem.id));
            if (!product) return;

            if (product.stock < newItem.quantity) {
                showToast(`الكمية المتوفرة غير كافية لـ ${product.name}. المتوفر: ${product.stock}`, 'error');
                return;
            }

            newItem = {
                ...newItem,
                name: product.name,
                productId: product.id,
                sellingPrice: currentItem.isFree ? 0 : Number(product.sellingPrice),
                originalPrice: Number(product.sellingPrice)
            };
        } else {
            const pkg = packages.find(p => p.id === Number(currentItem.id));
            if (!pkg) return;

            // Simple stock verification for packages could go here, but complex logic is on backend.
            // We'll trust backend or do a basic check if we had full nested stock data.

            newItem = {
                ...newItem,
                name: pkg.name,
                packageId: pkg.id,
                sellingPrice: currentItem.isFree ? 0 : Number(pkg.sellingPrice),
                originalPrice: Number(pkg.sellingPrice)
            };
        }

        setItems([...items, newItem]);
        setCurrentItem({ id: '', quantity: 1, isFree: false });
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
            discountType: 'AMOUNT',
            orderSource: '',
        });
        setItems([]);
        setCustomerSearch('');
        setRedeemedPoints(0);
        setCurrentItemType('PRODUCT');
        setShowModal(true);
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

        // If points cover a specific amount, we add it to regular discount or treat separately
        // BE Logic: redeemedPoints are separate. Here we just show the visual calc.
        // Actually BE logic handles points value separately on top of discount?
        // Let's assume points just reduce total, but for simplicity here we might bind it to discount field?
        // No, `redeemedPoints` is sent separately. `formData.discount` is EXTRA manual discount.
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
                    productId: item.productId,
                    packageId: item.packageId,
                    quantity: item.quantity,
                    isFree: item.isFree
                })),
                redeemedPoints
            };

            await api.post('/orders', orderData);
            showToast('تم إنشاء الطلب بنجاح', 'success');
            setShowModal(false);
            setItems([]);
            fetchOrders();
            fetchProducts(); // Update stock
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
        // Discount logic display
        let discountDisplay = '';
        if (order.discount > 0) {
            if (order.discountType === 'PERCENTAGE') {
                discountDisplay = `الخصم: -${order.discount}% (${(subtotal * (order.discount / 100)).toLocaleString()} د.ع)\n`;
            } else {
                discountDisplay = `الخصم: -${Number(order.discount).toLocaleString()} د.ع\n`;
            }
        }

        const deliveryFee = order.deliveryPaidBy === 'CUSTOMER' ? Number(order.deliveryCost) : 0;
        const total = Number(order.totalSellingPrice) + deliveryFee; // totalSellingPrice stored in DB already includes discount logic? No, check Order model. 
        // Actually Order model has `totalSellingPrice`. 

        const itemsText = order.items.map(i => {
            const name = i.productName || (i.product ? i.product.name : i.package ? i.package.name : 'منتج');
            const freeTag = i.isFree ? ' (هدية 🎁)' : '';
            return `✨ ${name} (${i.quantity} قطعة)${freeTag}`;
        }).join('\n');

        const text = `*اميرتنا ${order.customerName || 'جميلتنا'} - فاتورة مبيعات لوماك كوزمتك*\n\n` +
            `يا هلا بيج ونورتينا.. هذي تفاصيل طلبج الحلو: 🌸\n\n` +
            `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-IQ')}\n\n` +
            `*المحتويات:*\n${itemsText}\n\n` +
            `---------------------------\n` +
            `المجموع: ${subtotal.toLocaleString()} د.ع\n` +
            discountDisplay +
            `التوصيل: ${order.deliveryPaidBy === 'SHOP' ? 'مجاني 🎁' : `${Number(order.deliveryCost).toLocaleString()} د.ع`}\n` +
            `*الإجمالي النهائي: ${total.toLocaleString()} د.ع*\n\n` +
            (order.customer?.points !== undefined ? `⭐ رصيد نقاطج الحالي: ${order.customer.points} نقطة\n` +
                `🎁 تكدرين تستخدمين نقاطج كخصم مباشر أو توصيل مجاني بطلباتج الجاية.. ننتظرج دائماً ✨\n\n` : '') +
            `تتهنين بيهم يا رب وشكراً لاختيارج لوماك كوزمتك ✨`;

        let phone = order.customer?.phone || '';
        phone = phone.replace(/[^\d]/g, '');

        if (phone) {
            if (phone.startsWith('0')) {
                phone = '964' + phone.substring(1);
            } else if (!phone.startsWith('964')) {
                phone = '964' + phone;
            }
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        } else {
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
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    ${item.productName || item.product?.name || item.package?.name}
                    ${item.isFree ? '<span style="color:red; font-size: 0.8em"> (هدية)</span>' : ''}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">${Number(item.sellingPrice).toLocaleString()} د.ع</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">${(Number(item.sellingPrice) * item.quantity).toLocaleString()} د.ع</td>
            </tr>
        `).join('');

        const subtotal = order.items.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0);
        const discountAmount = order.discountType === 'PERCENTAGE'
            ? (subtotal * (order.discount / 100))
            : Number(order.discount || 0);

        const deliveryFee = order.deliveryPaidBy === 'CUSTOMER' ? Number(order.deliveryCost) : 0;
        const total = (subtotal - discountAmount) + deliveryFee;

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>Lumaq Cosmetics - Invoice</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
                    body { font-family: 'Tajawal', sans-serif; padding: 30px; color: #4a1d1f; background: #fff; margin: 0; }
                    .container { max-width: 700px; margin: 0 auto; border: 2px solid #fbcfe8; padding: 40px; border-radius: 20px; position: relative; }
                    /* ... styles same as before ... */
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { text-align: right; padding: 15px; color: #db2777; border-bottom: 2px solid #fbcfe8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 style="color: #db2777; text-align: center;">لوماك كوزمتك</h1>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <strong>الأميرة:</strong> ${order.customerName}<br>
                            ${order.customer?.phone ? `<strong>الهاتف:</strong> ${order.customer.phone}` : ''}
                        </div>
                        <div style="text-align: left;">
                            <strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleDateString('ar-IQ')}
                        </div>
                    </div>

                    <table>
                        <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>

                     <div style="text-align: left; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p>المجموع: ${subtotal.toLocaleString()} د.ع</p>
                        ${discountAmount > 0 ? `<p style="color: #db2777;">الخصم: -${discountAmount.toLocaleString()} د.ع</p>` : ''}
                        <p>التوصيل: ${order.deliveryPaidBy === 'SHOP' ? 'مجاني' : `${deliveryFee.toLocaleString()} د.ع`}</p>
                        <h2 style="color: #db2777; font-size: 1.5rem; margin: 10px 0;">الإجمالي: ${total.toLocaleString()} د.ع</h2>
                    </div>

                    ${order.customer ? `
                    <div style="margin-top: 20px; padding: 10px; background: #fdf2f8; border-radius: 10px; text-align: center;">
                        <p style="margin: 0; color: #db2777; font-weight: bold;">✨ رصيد نقاطج الحالي: ${order.customer.points} نقطة</p>
                        <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #666;">تكدرين تستخدمين نقاطج كخصم بطلباتج الجاية.. كلش نفرح بيج 💖</p>
                    </div>
                    ` : ''}

                    <div style="margin-top: 30px; text-align: center; color: #888; border-top: 2px dashed #eee; padding-top: 20px;">
                        <p style="font-weight: bold; color: #db2777; margin-bottom: 5px;">شكراً لثقتج واختيارح لوماك كوزمتك 🌸</p>
                        <p style="font-size: 0.9rem; margin: 0;">ان شاء الله تتهنين بيهم يا رب وتكونين دائماً مميزة ✨</p>
                        <p style="font-size: 0.8rem; margin-top: 10px;">لأي ملاحظة أو استفسار، احنا موجودين وبالخدمة تدللين</p>
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

    // Calculate current cart totals for display
    const currentCartSubtotal = items.reduce((acc, item) => acc + (Number(item.sellingPrice) * item.quantity), 0);
    const cartDiscountValue = formData.discountType === 'PERCENTAGE'
        ? (currentCartSubtotal * (Number(formData.discount) / 100))
        : Number(formData.discount);
    const currentCartTotal = (currentCartSubtotal - cartDiscountValue) + (formData.deliveryPaidBy === 'CUSTOMER' ? Number(formData.deliveryCost) : 0);

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة الـطلبات</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={handleOpenModal}>
                    <Plus size={20} />
                    إنشاء طلب جديد
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div className="flex gap-md" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="ابحث عن طلب..."
                        className="input"
                        style={{ flex: 1, minWidth: '300px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <input
                        type="date"
                        className="input"
                        style={{ width: 'auto' }}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>لا توجد طلبات تطابق الاختيارات</div>
            ) : (
                Object.entries(groupedOrders).map(([date, dayOrders]) => (
                    <div key={date} style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-gold)' }}>{date} ({dayOrders.length})</h3>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>رقم الطلب</th>
                                        <th style={{ padding: '1rem' }}>الزبون</th>
                                        <th style={{ padding: '1rem' }}>القيمة</th>
                                        <th style={{ padding: '1rem' }}>الريح</th>
                                        <th style={{ padding: '1rem' }}>الحالة</th>
                                        <th style={{ padding: '1rem' }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayOrders.map((order) => {
                                        const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
                                        return (
                                            <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1rem' }}>#{order.orderNumber.split('-')[0]}</td>
                                                <td style={{ padding: '1rem' }}>{order.customerName || 'زائر'}</td>
                                                <td style={{ padding: '1rem' }}>{Number(order.totalSellingPrice).toLocaleString()}</td>
                                                <td style={{ padding: '1rem', color: 'var(--accent-gold)' }}>{Number(order.totalProfit).toLocaleString()}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ color: statusConfig[order.status]?.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <StatusIcon size={14} /> {statusConfig[order.status]?.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div className="flex gap-sm">
                                                        <button onClick={() => handlePrint(order)} className="btn btn-outline" style={{ width: 32, height: 32, padding: 0 }}><Printer size={14} /></button>
                                                        <button onClick={() => handleWhatsAppShare(order)} className="btn btn-outline" style={{ width: 32, height: 32, padding: 0, color: '#25D366', borderColor: '#25D366' }}><MessageCircle size={14} /></button>
                                                        {order.status === 'NEW' && (
                                                            <>
                                                                <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="btn btn-outline" disabled={updatingStatusId === order.id}>شحن</button>
                                                                <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="btn btn-outline" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} disabled={updatingStatusId === order.id}>إلغاء</button>
                                                            </>
                                                        )}
                                                        {order.status === 'SHIPPED' && (
                                                            <>
                                                                <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="btn btn-primary" style={{ background: 'var(--accent-green)' }} disabled={updatingStatusId === order.id}>تم</button>
                                                                <button onClick={() => updateStatus(order.id, 'RETURNED')} className="btn btn-outline" style={{ color: 'var(--accent-red)' }} disabled={updatingStatusId === order.id}>راجع</button>
                                                            </>
                                                        )}
                                                        {order.status === 'COMPLETED' && (
                                                            (() => {
                                                                const completedDate = new Date(order.completedAt || order.updatedAt);
                                                                const daysDiff = (new Date() - completedDate) / (1000 * 60 * 60 * 24);
                                                                if (daysDiff >= 2) {
                                                                    return <button onClick={() => handleSendFeedback(order)} className="btn btn-outline" style={{ color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)', fontSize: '0.75rem' }}>تقييم</button>;
                                                                }
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
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>الزبون</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="ابحث عن زبون..."
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
                                <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                                    {customers.map(c => (
                                        <div key={c.id} onClick={() => handleCustomerSelect(c)} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                                            {c.name} <small style={{ color: 'var(--text-secondary)' }}>{c.phone}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>محتويات الطلب</h4>

                        <div className="flex gap-md mb-md" style={{ marginBottom: '1rem' }}>
                            <button
                                type="button"
                                className={`btn ${currentItemType === 'PRODUCT' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => { setCurrentItemType('PRODUCT'); setCurrentItem({ ...currentItem, id: '' }); }}
                                style={{ flex: 1 }}
                            >
                                <Package size={16} style={{ marginLeft: '0.5rem' }} /> منتج مفرد
                            </button>
                            <button
                                type="button"
                                className={`btn ${currentItemType === 'PACKAGE' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => { setCurrentItemType('PACKAGE'); setCurrentItem({ ...currentItem, id: '' }); }}
                                style={{ flex: 1 }}
                            >
                                <Gift size={16} style={{ marginLeft: '0.5rem' }} /> بكج
                            </button>
                        </div>

                        <div className="flex gap-sm" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                    {currentItemType === 'PRODUCT' ? 'اختر المنتج' : 'اختر البكج'}
                                </label>
                                <select className="input" value={currentItem.id} onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}>
                                    <option value="">اختر...</option>
                                    {currentItemType === 'PRODUCT' ? (
                                        products.map(p => (
                                            <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                                {p.name} ({p.stock > 0 ? `${Number(p.sellingPrice).toLocaleString()}` : '0'})
                                            </option>
                                        ))
                                    ) : (
                                        packages.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({Number(p.sellingPrice).toLocaleString()})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div style={{ width: '80px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>الكمية</label>
                                <input type="number" className="input" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })} />
                            </div>

                            {/* Free Item Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', height: '42px', padding: '0 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                <label className="flex items-center gap-xs" style={{ cursor: 'pointer', fontSize: '0.8rem', margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={currentItem.isFree}
                                        onChange={(e) => setCurrentItem({ ...currentItem, isFree: e.target.checked })}
                                        style={{ accentColor: 'var(--accent-gold)' }}
                                    />
                                    مجاني؟
                                </label>
                            </div>

                            <button type="button" onClick={addItem} className="btn btn-primary" style={{ height: '42px', width: '42px', padding: 0 }}><Plus size={20} /></button>
                        </div>

                        {items.length > 0 && (
                            <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                                {items.map((item, index) => (
                                    <div key={index} className="flex" style={{ justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', background: item.isFree ? 'rgba(255, 215, 0, 0.05)' : 'transparent' }}>
                                        <div className="flex gap-sm">
                                            {item.type === 'PACKAGE' ? <Gift size={16} color="var(--accent-gold)" /> : <Package size={16} />}
                                            <span>
                                                {item.name} <small>x{item.quantity}</small>
                                                {item.isFree && <span style={{ color: 'var(--accent-gold)', fontSize: '0.8rem', marginRight: '0.5rem' }}>(مجاني)</span>}
                                            </span>
                                        </div>
                                        <div className="flex" style={{ gap: '1rem' }}>
                                            <span style={{ textDecoration: item.isFree ? 'line-through' : 'none', color: item.isFree ? 'var(--text-secondary)' : 'inherit' }}>
                                                {(item.originalPrice * item.quantity).toLocaleString()}
                                            </span>
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

                    <div className="flex gap-md" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>التغليف</label>
                            <input type="number" className="input" value={formData.packagingCost} onChange={(e) => setFormData({ ...formData, packagingCost: e.target.value })} min="0" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>التوصيل</label>
                            <div className="flex">
                                <input type="number" className="input" style={{ flex: 1, borderRadius: '0 4px 4px 0' }} value={formData.deliveryCost} onChange={(e) => setFormData({ ...formData, deliveryCost: e.target.value })} min="0" />
                                <select className="input" style={{ flex: 1, borderRadius: '4px 0 0 4px' }} value={formData.deliveryPaidBy} onChange={(e) => setFormData({ ...formData, deliveryPaidBy: e.target.value })}>
                                    <option value="CUSTOMER">الزبون</option>
                                    <option value="SHOP">المتجر</option>
                                </select>
                            </div>
                        </div>

                        {/* Improved Discount Control */}
                        <div className="input-group" style={{ flex: 1.5 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>الخصم</label>
                            <div className="flex">
                                <input
                                    type="number"
                                    className="input"
                                    style={{ flex: 1, borderRadius: '0 4px 4px 0' }}
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    min="0"
                                />
                                <select
                                    className="input"
                                    style={{ width: '80px', borderRadius: '4px 0 0 4px', textAlign: 'center' }}
                                    value={formData.discountType}
                                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                >
                                    <option value="AMOUNT">ع.د</option>
                                    <option value="PERCENTAGE">%</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>المصدر</label>
                            <select className="input" value={formData.orderSource} onChange={(e) => setFormData({ ...formData, orderSource: e.target.value })}>
                                <option value="">اختر...</option>
                                <option value="INSTAGRAM">انستجرام</option>
                                <option value="TIKTOK">تيك توك</option>
                                <option value="WHATSAPP">واتساب</option>
                                <option value="FACEBOOK">فيسبوك</option>
                                <option value="OFFLINE">مباشر</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--glass-border)', borderRadius: '8px', textAlign: 'left' }}>
                        <div className="flex justify-between mb-sm">
                            <span>المجموع الفرعي:</span>
                            <span>{currentCartSubtotal.toLocaleString()} د.ع</span>
                        </div>
                        {cartDiscountValue > 0 && (
                            <div className="flex justify-between mb-sm" style={{ color: 'var(--accent-gold)' }}>
                                <span>الخصم ({formData.discountType === 'PERCENTAGE' ? '%' : 'مبلغ'}):</span>
                                <span>- {cartDiscountValue.toLocaleString()} د.ع</span>
                            </div>
                        )}
                        <div className="flex justify-between mb-sm">
                            <span>التوصيل:</span>
                            <span>{formData.deliveryPaidBy === 'SHOP' ? 'مجاني (على المتجر)' : `${Number(formData.deliveryCost).toLocaleString()} د.ع`}</span>
                        </div>
                        <div className="flex justify-between" style={{ fontSize: '1.2rem', fontWeight: 'bold', borderTop: '1px solid #555', paddingTop: '0.5rem' }}>
                            <span>الإجمالي النهائي:</span>
                            <span>{currentCartTotal.toLocaleString()} د.ع</span>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الطلب'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Orders;
