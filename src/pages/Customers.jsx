import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { Plus, User, Phone, MapPin, Award, ShoppingBag, MessageCircle, Gift, Search, CheckCircle, Instagram, Edit, Tag, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Customers = () => {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        instagram: '',
        tags: ''
    });
    const [showInactive, setShowInactive] = useState(false);
    const [inactiveCount, setInactiveCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Gift Feature States
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [giftPoints, setGiftPoints] = useState(0);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [recipientResults, setRecipientResults] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [isGifting, setIsGifting] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async (search = '', inactive = false) => {
        setLoading(true);
        try {
            const endpoint = inactive ? '/customers/reports/inactive' : `/customers?search=${search}`;
            const { data } = await api.get(endpoint);
            setCustomers(data.data);
            if (!inactive && !search) {
                // Fetch inactive count once
                const { data: inactData } = await api.get('/customers/reports/inactive');
                setInactiveCount(inactData.count);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        fetchCustomers(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/customers/${editingId}`, formData);
                showToast('تم تحديث بيانات الزبون بنجاح', 'success');
            } else {
                await api.post('/customers', formData);
                showToast('تمت إضافة الزبون بنجاح', 'success');
            }
            setShowModal(false);
            resetForm();
            fetchCustomers();
            if (selectedCustomer && selectedCustomer.id === editingId) {
                viewCustomerDetails(editingId);
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'فشل العملية', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', address: '', instagram: '', tags: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (customer) => {
        setFormData({
            name: customer.name || '',
            phone: customer.phone,
            address: customer.address || '',
            instagram: customer.instagram || '',
            tags: customer.tags || ''
        });
        setIsEditing(true);
        setEditingId(customer.id);
        setShowModal(true);
    };

    const viewCustomerDetails = async (id) => {
        try {
            const { data } = await api.get(`/customers/${id}`);
            setSelectedCustomer(data.data);
        } catch (error) {
            showToast('فشل تحميل بيانات الزبون', 'error');
        }
    };

    const handleSendReminder = (customer) => {
        const displayName = customer.name || (customer.instagram ? `@${customer.instagram}` : 'جميلتنا');
        const text = `*حبيبتي ${displayName} من لوماك كوزمتك.. اشتاقينالج! 🌸*\n\n` +
            `حبينا نذكرج إن عندج رصيد قيد الانتظار:\n` +
            `⭐ *${customer.points} نقطة*\n\n` +
            `تكدرين تستخدميهم بطلبج الجاي كخصم أو توصيل مجاني.. منتظريج تنورينا بجمالج ✨\n\n` +
            `تتهنين يا رب 🌸`;

        let phone = customer.phone.replace(/[^\d]/g, '');
        if (phone.startsWith('0')) {
            phone = '964' + phone.substring(1);
        } else if (!phone.startsWith('964')) {
            phone = '964' + phone;
        }

        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const searchRecipient = async (search) => {
        setRecipientSearch(search);
        if (!search) {
            setRecipientResults([]);
            return;
        }
        try {
            const { data } = await api.get(`/customers?search=${search}`);
            // Filter out the sender
            setRecipientResults(data.data.filter(c => c.id !== selectedCustomer.id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleGiftSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRecipient || giftPoints <= 0) return;

        setIsGifting(true);
        try {
            await api.post('/customers/transfer-points', {
                senderId: selectedCustomer.id,
                recipientId: selectedRecipient.id,
                points: giftPoints
            });

            showToast('تم إهداء النقاط بنجاح ✨', 'success');

            // WhatsApp Gift Message
            const recipientName = selectedRecipient.name || (selectedRecipient.instagram ? `@${selectedRecipient.instagram}` : 'جميلتنا');
            const senderName = selectedCustomer.name || (selectedCustomer.instagram ? `@${selectedCustomer.instagram}` : 'صديقتج');

            const giftText = `*مفاجأة لجميلتنا ${recipientName}! 🌸*\n\n` +
                `حبينا نكلج إن ${senderName} أهدتج:\n` +
                `⭐ *${giftPoints} نقطة* من لوماك كوزمتك!\n\n` +
                `تكدرين تستخدميهم بطلبج الجاي كخصم أو توصيل مجاني.. تتهنين بجمالج ✨`;

            let phone = selectedRecipient.phone.replace(/[^\d]/g, '');
            if (phone.startsWith('0')) phone = '964' + phone.substring(1);
            else if (!phone.startsWith('964')) phone = '964' + phone;

            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(giftText)}`;
            window.open(url, '_blank');

            setShowGiftModal(false);
            setGiftPoints(0);
            setSelectedRecipient(null);
            setRecipientSearch('');
            viewCustomerDetails(selectedCustomer.id); // Refresh sender details
        } catch (error) {
            showToast(error.response?.data?.message || 'فشل تحويل النقاط', 'error');
        } finally {
            setIsGifting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>إدارة الزبائن</h1>
                <button className="btn btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    إضافة زبون
                </button>
            </div>

            <div className="flex gap-sm" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
                <div className="card" style={{ flex: 1, padding: '0.75rem' }}>
                    <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="ابحث بالاسم، رقم الهاتف، أو يوزر الانستا..."
                            className="input"
                            value={searchTerm}
                            onChange={handleSearch}
                            style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.25rem' }}
                        />
                    </div>
                </div>
                <button
                    className={`btn ${showInactive ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        height: '54px',
                        whiteSpace: 'nowrap',
                        borderColor: showInactive ? 'var(--accent-gold)' : 'var(--glass-border)',
                        color: showInactive ? 'white' : 'var(--accent-gold)'
                    }}
                    onClick={() => {
                        const newVal = !showInactive;
                        setShowInactive(newVal);
                        fetchCustomers(searchTerm, newVal);
                    }}
                >
                    <Clock size={18} />
                    جميلات غائبات {inactiveCount > 0 && <span style={{ background: 'var(--accent-red)', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '0.7rem' }}>{inactiveCount}</span>}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 350px' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>الحساب / الاسم</th>
                                <th style={{ padding: '1rem' }}>الهاتف</th>
                                <th style={{ padding: '1rem' }}>التصنيف</th>
                                <th style={{ padding: '1rem' }}>النقاط</th>
                                <th style={{ padding: '1rem' }}>الطلبات</th>
                                <th style={{ padding: '1rem' }}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>لا يوجد زبائن</td></tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => viewCustomerDetails(c.id)}>
                                        <td style={{ padding: '1rem' }}>
                                            <div className="flex flex-col">
                                                <span style={{ color: c.instagram ? 'var(--accent-gold)' : 'inherit', fontWeight: c.instagram ? 'bold' : 'normal' }}>
                                                    {c.instagram ? `@${c.instagram.replace('@', '')}` : (c.name || 'زبون بلا اسم')}
                                                </span>
                                                {c.instagram && c.name && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.name}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{c.phone}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div className="flex gap-xs flex-wrap">
                                                {c.tags ? c.tags.split(',').map((tag, idx) => (
                                                    <span key={idx} style={{ fontSize: '0.7rem', background: 'rgba(219, 39, 119, 0.1)', color: 'var(--accent-pink)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(219, 39, 119, 0.2)' }}>
                                                        {tag.trim()}
                                                    </span>
                                                )) : '-'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-gold)' }}>
                                                <Award size={14} />
                                                {c.points}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{c._count?.orders || 0} طلب</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>تفاصيل</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {selectedCustomer && (
                    <div className="card animate-fade-in" style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '1rem' }}>
                        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>تفاصيل الزبون</h3>
                            <div className="flex gap-sm">
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0.4rem', borderRadius: '50%' }}
                                    onClick={() => handleEdit(selectedCustomer)}
                                    title="تعديل البيانات"
                                >
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-md">
                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                <User size={18} color="var(--accent-gold)" />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>الاسم</div>
                                    <div>{selectedCustomer.name || 'غير محدد'}</div>
                                </div>
                            </div>
                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                <Phone size={18} color="var(--accent-gold)" />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>رقم الهاتف</div>
                                    <div>{selectedCustomer.phone}</div>
                                </div>
                            </div>
                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                <Instagram size={18} color="var(--accent-gold)" />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>حساب الانستا</div>
                                    <div style={{ dir: 'ltr', textAlign: 'right' }}>{selectedCustomer.instagram ? `@${selectedCustomer.instagram.replace('@', '')}` : 'غير متوفر'}</div>
                                </div>
                            </div>
                            <div className="flex gap-sm" style={{ alignItems: 'flex-start' }}>
                                <Tag size={18} color="var(--accent-gold)" style={{ marginTop: '0.25rem' }} />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>التصنيفات</div>
                                    <div className="flex gap-xs flex-wrap" style={{ marginTop: '0.25rem' }}>
                                        {selectedCustomer.tags ? selectedCustomer.tags.split(',').map((tag, idx) => (
                                            <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(219, 39, 119, 0.1)', color: 'var(--accent-pink)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(219, 39, 119, 0.3)' }}>
                                                {tag.trim()}
                                            </span>
                                        )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>لا توجد تصنيفات</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                <MapPin size={18} color="var(--accent-gold)" />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>العنوان</div>
                                    <div>{selectedCustomer.address || 'غير محدد'}</div>
                                </div>
                            </div>
                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                <Award size={18} color="var(--accent-gold)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>نقاط الولاء</div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>{selectedCustomer.points} نقطة</div>
                                </div>
                                {selectedCustomer.points > 0 && (
                                    <div className="flex gap-sm">
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '0.8rem',
                                                background: '#25D366',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}
                                            onClick={() => handleSendReminder(selectedCustomer)}
                                        >
                                            <MessageCircle size={14} />
                                            تذكير
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '0.8rem',
                                                color: 'var(--accent-gold)',
                                                borderColor: 'var(--accent-gold)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}
                                            onClick={() => setShowGiftModal(true)}
                                        >
                                            <Gift size={14} />
                                            إهداء
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShoppingBag size={18} />
                                سجل الطلبات
                            </h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {selectedCustomer.orders?.length === 0 ? (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>لا توجد طلبات سابقة</div>
                                ) : (
                                    selectedCustomer.orders.map(o => (
                                        <div key={o.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                            <div className="flex" style={{ justifyContent: 'space-between' }}>
                                                <span style={{ fontFamily: 'monospace' }}>#{o.orderNumber.split('-')[0]}</span>
                                                <span style={{ color: 'var(--accent-gold)' }}>{Number(o.totalSellingPrice).toLocaleString()} د.ع</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(o.createdAt).toLocaleDateString('ar-IQ')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={isEditing ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>الاسم (اختياري)</label>
                        <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>رقم الهاتف</label>
                        <input type="text" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>حساب الانستغرام (اختياري)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>@</span>
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: '2rem' }}
                                placeholder="username"
                                value={formData.instagram}
                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>التصنيفات (افصلي بينها بفاصلة)</label>
                        <div style={{ position: 'relative' }}>
                            <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="بشرة دهنية، جملة، مشاكسة..."
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>العنوان (اختياري)</label>
                        <textarea className="input" rows="3" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : (isEditing ? 'تعديل البيانات' : 'حفظ الزبون')}
                    </button>
                </form>
            </Modal>

            {/* Gift Points Modal */}
            <Modal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} title="إهداء النقاط لصديقة">
                <form onSubmit={handleGiftSubmit} className="flex flex-col gap-md">
                    <div style={{ background: 'rgba(219, 39, 119, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed #fbcfe8' }}>
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>المرسل: <span style={{ fontWeight: 'bold' }}>{selectedCustomer?.name}</span></div>
                        <div style={{ fontSize: '0.9rem' }}>الرصيد المتاح: <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{selectedCustomer?.points} نقطة</span></div>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>ابحثي عن الصديقة (المستلمة)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="الاسم أو رقم الهاتف..."
                                value={recipientSearch}
                                onChange={(e) => searchRecipient(e.target.value)}
                            />
                            {recipientResults.length > 0 && !selectedRecipient && (
                                <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: '0.25rem', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                    {recipientResults.map(r => (
                                        <div key={r.id} onClick={() => { setSelectedRecipient(r); setRecipientSearch(r.name || r.instagram || r.phone); setRecipientResults([]); }} style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}>
                                            <div className="flex flex-col">
                                                <span>{r.name || (r.instagram ? `@${r.instagram}` : 'زبون بلا اسم')}</span>
                                                {r.instagram && <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>@{r.instagram}</span>}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedRecipient && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={14} /> تم اختيار: {selectedRecipient.name}
                                <button type="button" onClick={() => setSelectedRecipient(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem' }}>(تغيير)</button>
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>عدد النقاط للهداية</label>
                        <input
                            type="number"
                            className="input"
                            min="1"
                            max={selectedCustomer?.points}
                            value={giftPoints}
                            onChange={(e) => setGiftPoints(parseInt(e.target.value) || 0)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--accent-gold)' }} disabled={isGifting || !selectedRecipient || giftPoints <= 0}>
                        {isGifting ? 'جاري الإرسال...' : 'تأكيد الإهداء وإرسال واتساب ✨'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;
