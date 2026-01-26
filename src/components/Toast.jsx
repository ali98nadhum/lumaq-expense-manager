import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
    const config = {
        success: { color: 'var(--accent-green)', icon: <CheckCircle size={20} /> },
        error: { color: 'var(--accent-red)', icon: <AlertCircle size={20} /> },
        info: { color: 'var(--accent-gold)', icon: <Info size={20} /> },
    };

    const { color, icon } = config[type] || config.info;

    return (
        <div className="animate-fade-in" style={{
            minWidth: '300px',
            background: 'var(--bg-secondary)',
            border: `1px solid ${color}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{ color }}>{icon}</div>
            <div style={{ flex: 1, fontSize: '0.95rem' }}>{message}</div>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
