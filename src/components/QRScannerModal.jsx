import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';

const QRScannerModal = ({ isOpen, onClose, eventId }) => {
    const scannerRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        const onScanSuccess = async (decodedText) => {
            if (loading || scanResult) return;
            
            try {
                // Assuming QR code contains JSON with userId or just the userId
                let userId = decodedText;
                try {
                    const data = JSON.parse(decodedText);
                    userId = data.userId || data.id;
                } catch (e) {
                    // Not JSON, use as is
                }

                setLoading(true);
                setError(null);
                
                // Pause scanner while checking
                scanner.pause();

                const response = await api.post(`/events/${eventId}/check-in`, { userId: Number(userId) });
                
                setScanResult({
                    success: true,
                    message: 'Check-in başarılı!',
                    user: response.user
                });

                // Resume scanning after 3 seconds
                setTimeout(() => {
                    setScanResult(null);
                    scanner.resume();
                }, 3000);

            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Check-in işlemi başarısız.');
                setTimeout(() => {
                    setError(null);
                    scanner.resume();
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        const onScanFailure = (error) => {
            // Ignore failure, happens constantly while scanning
        };

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [isOpen, eventId]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '90%', maxWidth: '400px', padding: 'var(--spacing-xl)', background: 'var(--color-bg-secondary)', borderRadius: '16px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ margin: 0 }}>QR Kod Tara</h3>
                    <button onClick={onClose} className="btn-close" style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}><X /></button>
                </div>

                <div id="qr-reader" style={{ width: '100%', minHeight: '300px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}></div>

                {loading && (
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                        <p>Doğrulanıyor...</p>
                    </div>
                )}

                {scanResult && (
                    <div style={{ 
                        marginTop: '15px', padding: '15px', borderRadius: '12px', 
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                        display: 'flex', alignItems: 'center', gap: '10px', color: '#22c55e'
                    }}>
                        <CheckCircle size={24} />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{scanResult.message}</div>
                            {scanResult.user && <div style={{ fontSize: '0.85rem' }}>{scanResult.user.name} {scanResult.user.surname}</div>}
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ 
                        marginTop: '15px', padding: '15px', borderRadius: '12px', 
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444'
                    }}>
                        <AlertTriangle size={24} />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Hata</div>
                            <div style={{ fontSize: '0.85rem' }}>{error}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerModal;
