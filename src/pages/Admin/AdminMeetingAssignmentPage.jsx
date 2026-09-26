import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, UserPlus, FileText, Send, CheckCircle2, AlertCircle, Search, User, X, Clock, Edit2, Trash2, Calendar, Video } from 'lucide-react';
import api from '../../services/api';

const AdminMeetingAssignmentPage = () => {
    const [formData, setFormData] = useState({
        participants: [], // Array of objects: { id, name, surname, title }
        title: '',
        content: '',
        type: 'mentorship',
        durationLimit: 25,
        scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        scheduledTime: '10:00',
        onlinePlatform: 'bondle',
        meetingLink: ''
    });
    
    const [searchUser, setSearchUser] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const fetchMeetings = async () => {
        try {
            const data = await api.request('/networking/admin/meetings');
            setMeetings(data || []);
        } catch (err) {
            console.error('Fetch Meetings Error:', err);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    // User Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchUser.length > 0) {
                try {
                    const results = await api.request(`/users/search?q=${searchUser}`);
                    // Exclude already selected users
                    const filteredResults = (results || []).filter(r => !formData.participants.some(p => p.id === r.id));
                    setSearchResults(filteredResults);
                } catch (err) { console.error(err); }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchUser, formData.participants]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.participants.length < 2) {
            alert('Lütfen en az iki kullanıcı seçin.');
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            if (editingId) {
                await api.request(`/networking/admin/meetings/${editingId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        participantIds: formData.participants.map(p => p.id),
                        content: formData.content,
                        type: formData.type,
                        title: formData.title,
                        durationLimit: parseInt(formData.durationLimit, 10),
                        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`),
                        zoomLink: formData.onlinePlatform === 'bondle' ? 'BONDLE_MEET' : formData.meetingLink
                    })
                });
                setStatus('success_updated');
            } else {
                await api.request('/networking/assign-admin', {
                    method: 'POST',
                    body: JSON.stringify({
                        participantIds: formData.participants.map(p => p.id),
                        content: formData.content,
                        type: formData.type,
                        title: formData.title,
                        durationLimit: parseInt(formData.durationLimit, 10),
                        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`),
                        zoomLink: formData.onlinePlatform === 'bondle' ? 'BONDLE_MEET' : formData.meetingLink
                    })
                });
                setStatus('success');
            }
            
            setFormData({ 
                participants: [],
                title: '', 
                content: '', 
                type: 'mentorship',
                durationLimit: 25,
                scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                scheduledTime: '10:00',
                onlinePlatform: 'bondle',
                meetingLink: ''
            });
            setSearchUser('');
            setEditingId(null);
            fetchMeetings();
        } catch (err) {
            console.error('Assignment Error:', err);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (meeting) => {
        const date = new Date(meeting.scheduledDate);
        setEditingId(meeting.id);
        
        // Katılımcıları belirle (eski kayıtlar için connection üzerinden)
        let participants = meeting.participants || [];
        if (participants.length === 0 && meeting.connection) {
            participants = [meeting.connection.user1, meeting.connection.user2];
        }

        setFormData({
            participants: participants.map(u => ({ id: u.id, name: u.name, surname: u.surname, title: u.title })),
            title: meeting.title || '',
            content: meeting.notes || '',
            type: meeting.type || 'mentorship',
            durationLimit: meeting.durationLimit !== undefined ? meeting.durationLimit : 25,
            scheduledDate: date.toISOString().split('T')[0],
            scheduledTime: date.toTimeString().split(' ')[0].substring(0, 5),
            onlinePlatform: (meeting.zoomLink && meeting.zoomLink !== 'BONDLE_MEET') ? 'external' : 'bondle',
            meetingLink: meeting.zoomLink === 'BONDLE_MEET' ? '' : (meeting.zoomLink || '')
        });
        setSearchUser('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu görüşmeyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.request(`/networking/admin/meetings/${id}`, { method: 'DELETE' });
            fetchMeetings();
        } catch (err) {
            console.error('Delete Error:', err);
            alert('Silme işlemi sırasında hata oluştu.');
        }
    };

    const selectUser = (user) => {
        setFormData(prev => ({
            ...prev,
            participants: [...prev.participants, { id: user.id, name: user.name, surname: user.surname, title: user.title }]
        }));
        setSearchUser('');
        setSearchResults([]);
    };

    const removeUser = (userId) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.id !== userId)
        }));
    };

    return (
        <div style={{ padding: '30px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <div style={{ padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '14px', color: 'var(--color-text-on-accent)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
                        {editingId ? 'Görüşmeyi Düzenle' : 'Görüşme Atama Paneli'}
                    </h1>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1.1rem', opacity: 0.9 }}>
                        {editingId ? 'Görüşme detaylarını güncelleyin.' : 'Kullanıcıları arayın ve profesyonel görüşmeler planlayın.'}
                    </p>
                </div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <form onSubmit={handleSubmit}>
                    
                    {/* Görüşme Başlığı ve Süresi */}
                    <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                <FileText size={20} color="#3b82f6" /> Görüşme Başlığı
                            </label>
                            <input 
                                type="text" 
                                required
                                placeholder="Örn: Kariyer Planlama"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                <Clock size={20} color="#3b82f6" /> Tarih & Saat
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="date" 
                                    required
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                                    style={{ flex: 2, padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                                />
                                <input 
                                    type="time" 
                                    required
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                                    style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                <Clock size={20} color="#3b82f6" /> Süre (Dakika) - 0 = Sınırsız
                            </label>
                            <input 
                                type="number" 
                                required
                                min="0"
                                max="180"
                                value={formData.durationLimit}
                                onChange={(e) => setFormData({...formData, durationLimit: e.target.value})}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            <Video size={20} color="#3b82f6" /> Görüşme Platformu / Linki
                        </label>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                                <input type="radio" name="onlinePlatform" value="bondle" checked={formData.onlinePlatform === 'bondle'} onChange={(e) => setFormData({...formData, onlinePlatform: e.target.value})} />
                                Bondle Meet (Yerleşik Görüntülü Görüşme)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                                <input type="radio" name="onlinePlatform" value="external" checked={formData.onlinePlatform === 'external'} onChange={(e) => setFormData({...formData, onlinePlatform: e.target.value})} />
                                Harici Link (Zoom, Meet vb.)
                            </label>
                        </div>
                        {formData.onlinePlatform === 'external' && (
                            <input 
                                type="text" 
                                required
                                placeholder="Örn: https://zoom.us/j/123456789"
                                value={formData.meetingLink}
                                onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                            />
                        )}
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        {/* Katılımcı Seçimi */}
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                <UserPlus size={20} color="#3b82f6" /> Katılımcılar
                            </label>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                                {formData.participants.map(p => (
                                    <div key={p.id} className=" admin-list-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#2563eb', padding: '8px 16px', borderRadius: '20px', fontWeight: 500, fontSize: '0.9rem' }}>
                                        {p.name} {p.surname}
                                        <X size={16} onClick={() => removeUser(p.id)} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text" 
                                    placeholder="Katılımcı eklemek için isim ile ara..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    style={{ width: '100%', padding: '15px 45px 15px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                                <Search size={20} style={{ position: 'absolute', right: '15px', top: '15px', color: '#94a3b8' }} />
                            </div>
                            
                            {searchResults.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-bg-primary)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '5px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    {searchResults.map(user => (
                                        <div key={user.id} onClick={() => selectUser(user)} style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-primary)'}>
                                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#3b82f6', color: 'var(--color-text-on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>{user.name.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{user.name} {user.surname}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.title || 'Kullanıcı'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '35px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            <FileText size={20} color="#6366f1" /> Görüşme Notları / Gündem
                        </label>
                        <textarea 
                            required
                            rows="4"
                            placeholder="Görüşme detaylarını buraya yazın..."
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: 'var(--color-bg-secondary)', resize: 'vertical', color: 'var(--color-text-primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <label style={{ block: 'block', marginBottom: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Görüşme Türü</label>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            {[
                                { id: 'mentorship', label: 'Mentorluk' },
                                { id: 'networking', label: 'Networking' },
                                { id: 'event', label: 'Özel Etkinlik' },
                                { id: 'meeting', label: 'Toplantı' },
                                { id: 'seminar', label: 'Seminer' }
                            ].map(t => (
                                <button 
                                    key={t.id}
                                    type="button"
                                    onClick={() => setFormData({...formData, type: t.id})}
                                    style={{ 
                                        padding: '12px 24px', borderRadius: '14px', border: '2px solid',
                                        borderColor: formData.type === t.id ? '#3b82f6' : '#f1f5f9',
                                        background: formData.type === t.id ? '#eff6ff' : 'var(--color-bg-primary)',
                                        color: formData.type === t.id ? '#2563eb' : '#64748b',
                                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            type="submit" 
                            disabled={loading || formData.participants.length < 2}
                            style={{ 
                                flex: 1, padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                                color: 'var(--color-text-on-accent)', border: 'none', fontWeight: 700, fontSize: '1.1rem', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                opacity: (loading || formData.participants.length < 2) ? 0.6 : 1, transition: 'all 0.3s',
                                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            {loading ? 'İşlem yapılıyor...' : <>{editingId ? <CheckCircle2 size={22} /> : <Send size={22} />} {editingId ? 'Değişiklikleri Kaydet' : 'Görüşmeyi Planla ve Bildir'}</>}
                        </button>
                        {editingId && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ 
                                        participants: [], title: '', content: '', type: 'mentorship',
                                        durationLimit: 25, scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], scheduledTime: '10:00',
                                        onlinePlatform: 'bondle', meetingLink: ''
                                    });
                                    setSearchUser('');
                                }}
                                style={{ 
                                    padding: '18px 30px', borderRadius: '16px', background: '#f1f5f9', 
                                    color: '#64748b', border: 'none', fontWeight: 700, fontSize: '1.1rem', 
                                    cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            >
                                İptal
                            </button>
                        )}
                    </div>
                </form>

                {status === 'success' && (
                    <div style={{ marginTop: '25px', padding: '20px', background: '#f0fdf4', color: '#166534', borderRadius: '14px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
                        <CheckCircle2 size={24} color="#22c55e" /> Görüşme başarıyla planlandı! Kullanıcıların "Yaklaşan Toplantılar" listesine eklendi.
                    </div>
                )}
                {status === 'success_updated' && (
                    <div style={{ marginTop: '25px', padding: '20px', background: '#f0fdf4', color: '#166534', borderRadius: '14px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
                        <CheckCircle2 size={24} color="#22c55e" /> Görüşme başarıyla güncellendi.
                    </div>
                )}
                {status === 'error' && (
                    <div style={{ marginTop: '25px', padding: '20px', background: '#fef2f2', color: '#991b1b', borderRadius: '14px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
                        <AlertCircle size={24} color="#ef4444" /> Bir hata oluştu. Lütfen bilgileri kontrol edip tekrar deneyin.
                    </div>
                )}
            </div>

            {/* Mevcut Görüşmeler Listesi */}
            <div style={{ marginTop: '50px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Atanan Görüşmeler</h2>
                    <span style={{ padding: '5px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                        {meetings.length} Toplam
                    </span>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                    {meetings.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-bg-primary)', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                            Henüz atanmış bir görüşme bulunmuyor.
                        </div>
                    ) : (
                        meetings.map(meeting => (
                            <div key={meeting.id} className=" admin-list-item" style={{ background: 'var(--color-bg-primary)', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{meeting.title}</div>
                                        <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> {new Date(meeting.scheduledDate).toLocaleString('tr-TR')}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <User size={14} /> 
                                                {meeting.participants && meeting.participants.length > 0 
                                                    ? meeting.participants.map(p => p.name).join(', ')
                                                    : (meeting.connection ? `${meeting.connection.user1.name} & ${meeting.connection.user2.name}` : 'Katılımcı Yok')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => handleEdit(meeting)}
                                        style={{ padding: '10px', borderRadius: '12px', border: 'none', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', transition: 'all 0.2s' }}
                                        title="Düzenle"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(meeting.id)}
                                        style={{ padding: '10px', borderRadius: '12px', border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', transition: 'all 0.2s' }}
                                        title="Sil"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMeetingAssignmentPage;
