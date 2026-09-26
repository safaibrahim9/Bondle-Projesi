import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    Bot, FileText, Mic, Send, X, AlertCircle, Sparkles, User as UserIcon, Lock, ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './AICoachPage.css';

const SHOPIER_URL = 'https://www.shopier.com/ShowProductNew/storefront.php?un=Bondlepremium';

const AICoachPage = () => {
    const { user, isPremium } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState(null); // 'cv' | 'interview' | null
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [cvInput, setCvInput] = useState('');
    const [cvMessages, setCvMessages] = useState([]);
    const [interviewInput, setInterviewInput] = useState('');
    const [interviewMessages, setInterviewMessages] = useState([]);

    const input = mode === 'cv' ? cvInput : interviewInput;
    const setInput = mode === 'cv' ? setCvInput : setInterviewInput;
    const messages = mode === 'cv' ? cvMessages : interviewMessages;
    const setMessages = mode === 'cv' ? setCvMessages : setInterviewMessages;

    const [position, setPosition] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Use localStorage to persist free uses across reloads
    const initialCvUses = isPremium() ? 999 : parseInt(localStorage.getItem(`ai_cv_uses_${user?.id}`) ?? '1');
    const [freeCvUsesLeft, setFreeCvUsesLeft] = useState(initialCvUses);

    const initialInterviewUses = isPremium() ? 999 : parseInt(localStorage.getItem(`ai_interview_uses_${user?.id}`) ?? '1');
    const [freeInterviewUsesLeft, setFreeInterviewUsesLeft] = useState(initialInterviewUses);
    const [interviewAnswers, setInterviewAnswers] = useState(0);
    const [interviewEnded, setInterviewEnded] = useState(false);

    const handleSetMode = (newMode) => {
        setMode(newMode);
        if (newMode !== null) {
            setMessages([]);
            setInterviewEnded(false);
            setPosition('');
        }
    };

    const decreaseCvUses = () => {
        if (!isPremium()) {
            setFreeCvUsesLeft(prev => {
                const newVal = prev - 1;
                localStorage.setItem(`ai_cv_uses_${user?.id}`, newVal.toString());
                return newVal;
            });
        }
    };

    const decreaseInterviewUses = () => {
        if (!isPremium()) {
            setFreeInterviewUsesLeft(prev => {
                const newVal = prev - 1;
                localStorage.setItem(`ai_interview_uses_${user?.id}`, newVal.toString());
                return newVal;
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleCVAnalyze = async () => {
        if (!input.trim()) return;
        if (!isPremium() && freeCvUsesLeft <= 0) {
            alert('Ücretsiz kullanım hakkınız doldu. Devam etmek için Premium alın.');
            return;
        }

        const userMsg = input;
        setInput('');
        setMessages([{ role: 'user', content: "İşte CV metnim:\n\n" + userMsg }]);
        setLoading(true);

        try {
            const res = await api.aiAnalyzeCV(userMsg);
            setMessages(prev => [...prev, { role: 'ai', content: res.feedback }]);
            decreaseCvUses();
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Üzgünüm, bir hata oluştu: " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isPremium() && freeCvUsesLeft <= 0) {
            alert('Ücretsiz kullanım hakkınız doldu. Devam etmek için Premium alın.');
            return;
        }

        setMessages([{ role: 'user', content: `📄 ${file.name} adlı PDF dosyası yüklendi. İnceleniyor...` }]);
        setLoading(true);

        try {
            const res = await api.aiAnalyzeCVPdf(file);
            setMessages(prev => [...prev, { role: 'ai', content: res.feedback }]);
            decreaseCvUses();
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Üzgünüm, bir hata oluştu: " + error.message }]);
        } finally {
            setLoading(false);
            e.target.value = null;
        }
    };

    const handleStartInterview = async () => {
        if (!position.trim()) return;
        if (!isPremium() && freeInterviewUsesLeft <= 0) {
            alert('Ücretsiz kullanım hakkınız doldu. Devam etmek için Premium alın.');
            return;
        }

        setMessages([]);
        setLoading(true);

        try {
            const res = await api.aiStartInterview(position);
            setMessages([{ role: 'ai', content: res.question }]);
            decreaseInterviewUses();
            setInterviewAnswers(0);
            setInterviewEnded(false);
        } catch (error) {
            setMessages([{ role: 'ai', content: "Üzgünüm, mülakat başlatılamadı: " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerInterview = async () => {
        if (!input.trim()) return;

        const userAns = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userAns }]);
        setLoading(true);

        try {
            // Get the last AI question
            const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
            const res = await api.aiAnswerInterview(position, lastAiMsg?.content || '', userAns);
            setMessages(prev => [...prev, { role: 'ai', content: res.feedbackAndNextQuestion }]);
            setInterviewAnswers(prev => prev + 1);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Üzgünüm, bir hata oluştu: " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleEndInterview = async () => {
        if (messages.length === 0) return;
        
        setLoading(true);
        setInterviewEnded(true);

        try {
            const res = await api.aiEndInterview(position, messages);
            setMessages(prev => [...prev, { role: 'ai', content: res.feedback }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Üzgünüm, mülakat sonlandırılamadı: " + error.message }]);
            setInterviewEnded(false);
        } finally {
            setLoading(false);
        }
    };

    const renderMessageContent = (content) => {
        return <ReactMarkdown>{content}</ReactMarkdown>;
    };

    if (!mode) {
        return (
            <div className="page ai-coach-page">
                <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
                    <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h1>AI Kariyer Koçu</h1>
                        <p className="text-secondary">Kariyerinde bir sonraki adımı atmak için yapay zeka gücünü kullan veya gerçek uzmanlardan destek al.</p>
                        {!isPremium() && (
                            <div className="free-limit-warning" style={{ marginTop: '12px', display: 'inline-flex' }}>
                                <AlertCircle size={16} />
                                Ücretsiz Haklarınız: CV Analizi <strong>{freeCvUsesLeft}</strong> | Mülakat <strong>{freeInterviewUsesLeft}</strong>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingBottom: '40px' }}>
                        <div className="ai-options-grid" style={{ width: '100%' }}>
                            <div className="ai-option-card" onClick={() => handleSetMode('cv')}>
                                <div className="ai-option-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                                    <FileText size={32} color="#fff" />
                                </div>
                                <h3>CV Analizi</h3>
                                <p>Özgeçmişini veya yeteneklerini yapıştır, zayıf ve güçlü yönlerini anında öğren.</p>
                            </div>

                            <div className="ai-option-card" onClick={() => handleSetMode('interview')}>
                                <div className="ai-option-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                                    <Mic size={32} color="#fff" />
                                </div>
                                <h3>Mülakat Simülasyonu</h3>
                                <p>İstediğin pozisyonu seç ve yapay zeka ile profesyonel bir mülakat pratiği yap.</p>
                            </div>

                            <div className="ai-option-card premium-option" onClick={() => isPremium() ? navigate('/mentors') : setShowPremiumModal(true)}>
                                <div className="ai-option-icon" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
                                    <UserIcon size={32} color="#fff" />
                                </div>
                                <h3>Gerçek Uzmanla Görüş</h3>
                                <p>Sistemdeki gönüllü şirket çalışanları ve mentorlardan gerçek mülakat talep et.</p>
                                {!isPremium() && (
                                    <div className="premium-lock">
                                        <Lock size={14} /> PREMIUM
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showPremiumModal && (
                        <div className="paywall-overlay" onClick={() => setShowPremiumModal(false)}>
                            <div className="paywall-card" onClick={e => e.stopPropagation()}>
                                <div className="premium-lock" style={{ position: 'static', display: 'inline-flex', marginBottom: '16px' }}>
                                    <Lock size={14} /> PREMIUM
                                </div>
                                <h2>Premium Özellik</h2>
                                <p>
                                    Gerçek uzmanlarla birebir mülakat ve mentorluk görüşmeleri yapabilmek sadece Premium kullanıcılara özeldir.
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button className="btn" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#6b21a8', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }} onClick={() => setShowPremiumModal(false)}>
                                        Kapat
                                    </button>
                                    <button className="btn" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/premium')}>
                                        <ExternalLink size={16} /> Premium'u Keşfet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="page ai-chat-page">
            <div className="chat-container">
                {/* Chat Header */}
                <div className="chat-header">
                    <button className="back-btn-icon" onClick={() => handleSetMode(null)}>
                        <X size={24} />
                    </button>
                    <div className="chat-header-info">
                        <div className="bot-avatar">
                            <Bot size={20} color="#fff" />
                        </div>
                        <div>
                            <h2>{mode === 'cv' ? 'CV Analiz Uzmanı' : 'İK Mülakat Uzmanı'}</h2>
                            <span>Çevrimiçi</span>
                        </div>
                    </div>
                    {!isPremium() && (
                        <div className="chat-header-limit">
                            {mode === 'cv' ? freeCvUsesLeft : freeInterviewUsesLeft} Hak Kaldı
                        </div>
                    )}
                    {mode === 'interview' && messages.length > 0 && !interviewEnded && (
                        <button 
                            onClick={handleEndInterview} 
                            disabled={loading} 
                            style={{marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.25)', cursor: 'pointer', fontSize: '13px', fontWeight: '700'}}
                        >
                            {loading ? '...' : 'Mülakatı Bitir'}
                        </button>
                    )}
                    {messages.length > 0 && (mode === 'cv' || interviewEnded) && (
                        <button 
                            onClick={() => {
                                setMessages([]);
                                setInterviewEnded(false);
                                setPosition('');
                            }} 
                            disabled={loading} 
                            style={{marginLeft: 'auto', background: 'var(--color-premium)', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}
                        >
                            {mode === 'cv' ? 'Yeni CV İncele' : 'Yeni Mülakat Başlat'}
                        </button>
                    )}
                </div>

                {/* Chat Messages */}
                <div className="chat-messages">
                    {messages.length === 0 && mode === 'interview' && (
                        <div className="setup-box">
                            <Sparkles size={32} color="var(--color-premium)" />
                            <h3>Hangi pozisyon için mülakat yapalım?</h3>
                            <input 
                                type="text" 
                                placeholder="Örn: Frontend Geliştirici, Ürün Yöneticisi..."
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="setup-input"
                            />
                            <button 
                                className="setup-btn"
                                onClick={handleStartInterview}
                                disabled={!position.trim() || loading}
                            >
                                {loading ? 'Hazırlanıyor...' : 'Mülakatı Başlat'}
                            </button>
                        </div>
                    )}

                    {messages.length === 0 && mode === 'cv' && (
                        <div className="setup-box">
                            <FileText size={32} color="#3b82f6" />
                            <h3>CV Metninizi veya Yeteneklerinizi Yapıştırın</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                                LinkedIn özetinizi, yeteneklerinizi metin olarak yapıştırabilir VEYA aşağıdan CV'nizi PDF olarak yükleyebilirsiniz.
                            </p>
                            <input 
                                type="file" 
                                accept=".pdf" 
                                style={{ display: 'none' }} 
                                id="cv-upload" 
                                onChange={handlePdfUpload} 
                                disabled={loading}
                            />
                            <label htmlFor="cv-upload" className="setup-btn" style={{ display: 'inline-block', textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
                                PDF Olarak Yükle
                            </label>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-wrapper ${msg.role}`}>
                            {msg.role === 'ai' && (
                                <div className="message-avatar">
                                    <Bot size={16} color="#fff" />
                                </div>
                            )}
                            <div className="message-bubble">
                                {renderMessageContent(msg.content)}
                            </div>
                        </div>
                    ))}
                    
                    {loading && messages.length > 0 && (
                        <div className="message-wrapper ai">
                            <div className="message-avatar">
                                <Bot size={16} color="#fff" />
                            </div>
                            <div className="message-bubble typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input or Paywall Message */}
                {((mode === 'cv' && messages.length === 0) || (mode === 'interview' && messages.length > 0) || (mode === 'cv' && messages.length > 0)) && !interviewEnded && (
                    <div className="chat-input-area">
                        {(!isPremium() && ((mode === 'cv' && freeCvUsesLeft <= 0 && messages.length > 0) || (mode === 'interview' && interviewAnswers >= 4))) ? (
                            <div style={{ width: '100%', textAlign: 'center', padding: '10px 0' }}>
                                <div className="premium-lock" style={{ position: 'static', display: 'inline-flex', marginBottom: '12px' }}>
                                    <Lock size={14} /> PREMIUM
                                </div>
                                <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Günlük ücretsiz limitine ulaştın</h3>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                                    AI Coach ile sınırsız kariyer planlaması yapmak ve mülakat simülasyonlarına devam etmek için Premium'a geç!
                                </p>
                                <button className="shopier-btn" onClick={() => navigate('/premium')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}>
                                    <ExternalLink size={18} /> Premium'u Keşfet
                                </button>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    placeholder={mode === 'cv' ? "CV'ni buraya yapıştır..." : "Cevabını yaz..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            mode === 'cv' ? handleCVAnalyze() : handleAnswerInterview();
                                        }
                                    }}
                                    rows={mode === 'cv' ? 4 : 2}
                                />
                                <button 
                                    className="send-btn"
                                    onClick={mode === 'cv' ? handleCVAnalyze : handleAnswerInterview}
                                    disabled={!input.trim() || loading}
                                >
                                    <Send size={20} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICoachPage;
