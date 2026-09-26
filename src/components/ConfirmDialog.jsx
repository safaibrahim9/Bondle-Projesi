import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    variant = 'default', // 'default' | 'danger'
    onConfirm,
    onCancel,
}) => {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="confirm-dialog-backdrop" onClick={handleBackdropClick}>
            <div className="confirm-dialog">
                <button className="confirm-dialog-close" onClick={onCancel}>
                    <X size={20} />
                </button>

                {variant === 'danger' && (
                    <div className="confirm-dialog-icon danger">
                        <AlertTriangle size={32} />
                    </div>
                )}

                <h3 className="confirm-dialog-title">{title}</h3>
                <p className="confirm-dialog-message">{message}</p>

                <div className="confirm-dialog-actions">
                    <button
                        className="btn btn-ghost"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
