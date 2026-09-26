import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Clock, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import './AdminDailyAnswersPage.css';

const AdminDailyAnswersPage = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnswers();
    }, []);

    const fetchAnswers = async () => {
        try {
            setLoading(true);
            const data = await api.getDailyAnswers();
            setAnswers(data || []);
        } catch (error) {
            console.error('Error fetching daily answers:', error);
            alert('Yanıtlar yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetWinner = async (answerId, rank) => {
        try {
            await api.setDailyAnswerWinner(answerId, rank);
            alert(`${rank}. olarak seçildi ve bildirim gönderildi!`);
            fetchAnswers(); // Refresh to show ranks if we add them to the query
        } catch (error) {
            console.error('Error setting winner:', error);
            alert('Kazanan seçilirken bir hata oluştu.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAnnounce = async () => {
        if (!window.confirm("Cevap veren herkese 'Sonuçlar açıklandı' bildirimi gidecek. Onaylıyor musunuz?")) return;
        try {
            await api.announceDailyWinners();
            alert("Tüm katılımcılara bildirim gönderildi!");
        } catch (error) {
            console.error(error);
            alert("Bildirim gönderilirken bir hata oluştu.");
        }
    };

    return (
        <div className="container" style={{ padding: 'var(--spacing-xl) 0' }}>
            <button className="btn-back" onClick={() => navigate('/admin')} style={{ marginBottom: 'var(--spacing-md)' }}>
                <ChevronLeft size={20} />
                <span>Admin Paneli</span>
            </button>

            <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MessageSquare size={32} color="#6366f1" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>Günün Sorusu Yanıtları</h1>
                        <p className="text-secondary" style={{ margin: 0 }}>Kullanıcıların günlük soruya verdikleri yanıtlar</p>
                    </div>
                </div>
                <button onClick={handleAnnounce} style={{ padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Sonuçları Bildir (Herkese)
                </button>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="loading-state">Yükleniyor...</div>
                ) : answers.length === 0 ? (
                    <div className="empty-state">Henüz hiç yanıt gönderilmemiş.</div>
                ) : (
                    <div className="answers-groups">
                        {Object.entries(
                            answers.reduce((groups, item) => {
                                const dateObj = new Date(item.answer_createdAt);
                                const dateStr = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
                                if (!groups[dateStr]) groups[dateStr] = [];
                                groups[dateStr].push(item);
                                return groups;
                            }, {})
                        ).map(([dateLabel, dayAnswers]) => (
                            <div key={dateLabel} className="answers-day-group" style={{ marginBottom: '40px' }}>
                                <h2 style={{ paddingBottom: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', color: '#1e293b' }}>
                                    {dateLabel}
                                </h2>
                                <div className="answers-grid">
                                    {dayAnswers.map(item => (
                                        <div key={item.answer_id} className="answer-card">
                                            <div className="answer-card-header">
                                                <div className="user-info">
                                                    {item.user_profilePicture || item.user_avatar ? (
                                                        <img src={item.user_profilePicture || item.user_avatar} alt="Avatar" className="user-avatar" />
                                                    ) : (
                                                        <div className="user-avatar-placeholder"><UserIcon size={20}/></div>
                                                    )}
                                                    <div className="user-details">
                                                        <h4>{item.user_name ? `${item.user_name} ${item.user_surname || ''}`.trim() : 'İsimsiz Kullanıcı'}</h4>
                                                        <span className="user-email">{item.user_email}</span>
                                                    </div>
                                                </div>
                                                <div className="answer-time">
                                                    <Clock size={14} />
                                                    <span>{formatDate(item.answer_createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="answer-content-area">
                                                <div className="question-bubble">
                                                    <strong>Soru:</strong> {item.answer_question}
                                                </div>
                                                <div className="answer-bubble">
                                                    <strong>Yanıt:</strong> {item.answer_answer}
                                                </div>
                                            </div>
                                            <div className="answer-actions">
                                                {item.answer_rank ? (
                                                    <div style={{ padding: '8px', background: '#ecfdf5', color: '#059669', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                                        {item.answer_rank}. Kazanan Olarak Seçildi!
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Podyum Seç:</span>
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                            <button className="rank-btn gold" onClick={() => handleSetWinner(item.answer_id, 1)}>1. Seç</button>
                                                            <button className="rank-btn silver" onClick={() => handleSetWinner(item.answer_id, 2)}>2. Seç</button>
                                                            <button className="rank-btn bronze" onClick={() => handleSetWinner(item.answer_id, 3)}>3. Seç</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDailyAnswersPage;
