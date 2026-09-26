import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Check, X, ExternalLink } from 'lucide-react';

const PremiumApprovalPage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchPendingRequests();
        }
    }, [user]);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const data = await api.getPendingPremiumRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching premium requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!confirm('Bu premium başvurusunu onaylıyor musunuz?')) {
            return;
        }

        try {
            await api.approvePremiumRequest(requestId);
            alert('Premium başvurusu onaylandı!');
            fetchPendingRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Hata: ' + error.message);
        }
    };

    const handleReject = async (requestId) => {
        const reason = prompt('Reddetme sebebi:');
        if (!reason) return;

        try {
            await api.rejectPremiumRequest(requestId, reason);
            alert('Premium başvurusu reddedildi');
            fetchPendingRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Hata: ' + error.message);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="page">
                <div className="container">
                    <p>Bu sayfaya erişim yetkiniz yok.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Bekleyen Premium Başvuruları</h1>

                {loading ? (
                    <p>Yükleniyor...</p>
                ) : requests.length === 0 ? (
                    <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <p className="text-secondary">Bekleyen premium başvurusu yok</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {requests.map(request => (
                            <div key={request.id} className=" admin-list-item" style={{ padding: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                                    <div>
                                        <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{request.user?.name} {request.user?.surname}</h3>
                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                            {request.user?.email}
                                        </p>
                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                            Başvuru Tarihi: {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                                        </p>
                                        {request.shopierOrderId && (
                                            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                                Sipariş ID: {request.shopierOrderId}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleApprove(request.id)}
                                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
                                        >
                                            <Check size={18} />
                                            Onayla
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => handleReject(request.id)}
                                            style={{ borderColor: '#ef4444', color: '#ef4444', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                                        >
                                            <X size={18} />
                                            Reddet
                                        </button>
                                    </div>
                                </div>

                                {request.paymentProof && (
                                    <div>
                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                            Ödeme Dekontu:
                                        </p>
                                        <a href={request.paymentProof} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                            <ExternalLink size={16} />
                                            Dekontu Görüntüle
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumApprovalPage;
