import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                zIndex: 9999,
                display: 'flex',
                padding: '2rem 1rem',
                overflowY: 'auto',
                backdropFilter: 'blur(8px)',
                direction: 'rtl'
            }}
        >
            <div
                className="card animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    margin: 'auto',
                    position: 'relative',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    zIndex: 10000
                }}
            >
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--accent-gold)' }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
