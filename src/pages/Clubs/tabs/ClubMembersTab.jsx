import React, { useState } from 'react';
import { Crown, Shield, User, ShieldCheck, ShieldAlert, Download, Users, Search, Link as LinkIcon, Copy } from 'lucide-react';

const getRoleBadge = (role) => {
    switch (role) {
        case 'president':
            return { label: 'Başkan', className: 'president', icon: <Crown size={10} /> };
        case 'board':
            return { label: 'Yönetim', className: 'board', icon: <Shield size={10} /> };
        default:
            return { label: 'Üye', className: 'member', icon: null };
    }
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// ─── VCF Generator ─────────────────────────────────────
const generateVCF = (membersList) => {
    const vCards = membersList.map(member => {
        const userData = member.user || {};
        const fullName = `${userData.name || ''} ${userData.surname || ''}`.trim() || 'Bilinmiyor';
        const email = userData.email || '';
        const phone = userData.phone || '';
        const university = userData.university || userData.branch || userData.department || '';

        // vCard 3.0 format
        let vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\n`;
        vcard += `FN:${fullName}\r\n`;
        vcard += `N:${userData.surname || ''};${userData.name || ''};;;\r\n`;
        if (email) vcard += `EMAIL:${email}\r\n`;
        if (phone) vcard += `TEL;TYPE=CELL:${phone}\r\n`;
        if (university) vcard += `ORG:${university}\r\n`;
        vcard += `END:VCARD\r\n`;
        return vcard;
    });

    const blob = new Blob([vCards.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kulup_stant_kayitlari.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const ClubMembersTab = ({ clubId, showToast, members = [], memberCount = 0, isPresident = false, officials = [], presidentId, onToggleOfficial, canManageOfficials = false, onUserClick }) => {
    const rawMembers = members.length > 0 ? members : [];
    
    const uniqueMembers = [];
    const seenIds = new Set();
    for (const m of rawMembers) {
        const uid = m.user?.id || m.userId;
        if (!seenIds.has(uid)) {
            seenIds.add(uid);
            uniqueMembers.push(m);
        }
    }
    
    const displayMembers = uniqueMembers.sort((a, b) => {
        const uidA = a.user?.id || a.userId;
        const uidB = b.user?.id || b.userId;
        const getRank = (uid) => {
            if (uid === presidentId) return 1;
            if (officials.some(o => (o.user?.id || o.userId) === uid)) return 2;
            return 3;
        };
        return getRank(uidA) - getRank(uidB);
    });

    const [loadingId, setLoadingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyStand, setShowOnlyStand] = useState(true); // Varsayılan olarak stant kayıtlarını göster

    const handleToggle = async (userId, isCurrentlyOfficial) => {
        setLoadingId(userId);
        await onToggleOfficial(userId, !isCurrentlyOfficial);
        setLoadingId(null);
    };

    const standMembers = displayMembers.filter(m => m.joinSource === 'stant');

    const isAdmin = isPresident || canManageOfficials;

    // Admin/Başkan için filtrelenmiş üye listesi (arama ve stant filtresi)
    const filteredMembers = displayMembers.filter(m => {
        const ud = m.user || {};
        const name = `${ud.name || ''} ${ud.surname || ''}`.trim().toLowerCase();
        const uni = (ud.university || ud.branch || ud.department || '').toLowerCase();
        const email = (ud.email || '').toLowerCase();
        
        const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || uni.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
        const matchesStand = (isAdmin && showOnlyStand) ? m.joinSource === 'stant' : true;
        
        return matchesSearch && matchesStand;
    });

    return (
        <div>
            {/* ─── Stant Kayıt Yönetim Paneli (Sadece Admin/Başkan) ─── */}
            {isAdmin && (
                <div style={{
                    marginBottom: '24px',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid rgba(147, 51, 234, 0.15)',
                    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)',
                }}>
                    {/* Sayaç Bölümü */}
                    <div style={{
                        padding: '28px 24px 20px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: 'white',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Users size={28} />
                            <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Stanttan Gelen Toplam Kayıt
                            </span>
                        </div>
                        <div style={{
                            fontSize: '56px',
                            fontWeight: '900',
                            lineHeight: 1.1,
                            background: 'linear-gradient(180deg, #ffffff 0%, #e9d5ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {standMembers.length}
                        </div>
                        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
                            yeni üye
                        </div>
                        
                        <div 
                            style={{ 
                                marginTop: '16px', 
                                padding: '10px 16px', 
                                background: 'rgba(255,255,255,0.15)', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onClick={() => {
                                const url = `${window.location.origin}/clubs/${clubId || ''}?ref=stant`;
                                navigator.clipboard.writeText(url);
                                if (showToast) showToast('Stant linki kopyalandı! 📋', 'success');
                                else alert('Stant linki kopyalandı! 📋');
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LinkIcon size={16} />
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>Stant Kayıt Linki</span>
                            </div>
                            <Copy size={16} style={{ opacity: 0.8 }} />
                        </div>
                    </div>

                    {/* Arama & İndir Butonları */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Arama ve Filtre */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9333ea', opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Üye ara (isim, bölüm, e-posta)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(147, 51, 234, 0.2)',
                                    background: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#9333ea'}
                                onBlur={e => e.target.style.borderColor = 'rgba(147, 51, 234, 0.2)'}
                            />
                        </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280', cursor: 'pointer', paddingLeft: '4px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={showOnlyStand} 
                                    onChange={(e) => setShowOnlyStand(e.target.checked)} 
                                    style={{ accentColor: '#9333ea', width: '16px', height: '16px' }}
                                />
                                Sadece Stanttan Gelenleri Göster
                            </label>
                        </div>

                        {/* VCF İndir Butonu */}
                        <button
                            onClick={() => generateVCF(filteredMembers)}
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                borderRadius: '14px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)';
                            }}
                        >
                            <Download size={20} />
                            Tümünü Rehbere Kaydet (VCF İndir)
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#7c3aed', opacity: 0.6, margin: 0 }}>
                            {filteredMembers.length} kişinin iletişim bilgisi indirilecek
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Normal Üye Listesi ─── */}
            <div className="club-members-header">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={20} color="var(--color-accent-primary)" />
                    Üyeler
                </h3>
                <span className="club-members-count">{memberCount || displayMembers.length} üye</span>
            </div>

            {filteredMembers.length > 0 ? (
                <div className="club-members-grid">
                    {filteredMembers.map((member, index) => {
                        const userData = member.user || {};
                        const userId = userData.id || member.userId;
                        const name = `${userData.name || ''} ${userData.surname || ''}`.trim() || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Anonim';
                        const photo = userData.profilePhoto || userData.avatar || userData.profilePicture;
                        
                        let role = 'member';
                        if (userId === presidentId) role = 'president';
                        else if (officials.some(o => (o.user?.id || o.userId) === userId)) role = 'board';

                        const badge = getRoleBadge(role);
                        const isCurrentlyOfficial = role === 'board';
                        const canToggle = canManageOfficials && role !== 'president';
                        
                        return (
                            <div key={member.id || index} className="club-member-card glass-card poster-card" onClick={() => onUserClick && onUserClick(member.user || member)} style={{ position: 'relative', cursor: onUserClick ? 'pointer' : 'default', padding: '16px', border: '1px solid rgba(147, 51, 234, 0.1)', background: 'linear-gradient(150deg, #ffffff 0%, #f5f3ff 40%, #e9d5ff 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="club-member-avatar">
                                    {photo ? (
                                        <img src={photo} alt={name} />
                                    ) : (
                                        <div className="club-member-avatar-placeholder">
                                            {getInitials(name)}
                                        </div>
                                    )}
                                </div>
                                <div className="club-member-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="club-member-name">
                                        {name}
                                    </div>
                                    <div className="club-member-role" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {userData.university || userData.department || 'Üye'}
                                        {member.joinSource === 'stant' && (
                                            <span style={{ background: '#9333ea', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                                STANT
                                            </span>
                                        )}
                                    </div>
                                    {/* Admin için e-posta bilgisi */}
                                    {isAdmin && userData.email && (
                                        <div style={{ fontSize: '0.75rem', color: '#7c3aed', opacity: 0.7 }}>
                                            ✉ {userData.email}
                                        </div>
                                    )}
                                    {(member.score !== undefined || member.participationRate !== undefined) && (
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', marginTop: '4px' }}>
                                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                🏆 {member.score || 0} Puan
                                            </div>
                                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                🎯 %{Number(member.participationRate || 0).toFixed(0)} Katılım
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className={`club-member-badge ${badge.className}`}>
                                    {badge.icon} {badge.label}
                                </span>
                                
                                {canToggle && (
                                    <button 
                                        className="btn btn-sm"
                                        style={{
                                            position: 'absolute', top: '10px', right: '10px',
                                            padding: '4px 8px', fontSize: '0.75rem',
                                            background: isCurrentlyOfficial ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            color: isCurrentlyOfficial ? '#ef4444' : '#22c55e',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                        onClick={() => handleToggle(userId, isCurrentlyOfficial)}
                                        disabled={loadingId === userId}
                                    >
                                        {loadingId === userId ? (
                                            'İşleniyor...'
                                        ) : isCurrentlyOfficial ? (
                                            <><ShieldAlert size={12} /> Yöneticiliği Al</>
                                        ) : (
                                            <><ShieldCheck size={12} /> Yönetici Yap</>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : searchTerm ? (
                <div style={{ textAlign: 'center', padding: '40px var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
                    <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                        "{searchTerm}" ile eşleşen üye bulunamadı
                    </p>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
                        <User size={24} color="var(--color-accent-primary)" />
                    </div>
                    <p style={{ marginBottom: '4px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                        {memberCount > 0 ? `${memberCount} üye bulunuyor` : 'Henüz üye yok'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)' }}>
                        {memberCount > 0 ? 'Üye listesi yakında görüntülenebilecek.' : 'İlk üye sen ol!'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClubMembersTab;
