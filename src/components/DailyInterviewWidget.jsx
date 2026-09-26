import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, X, Star, Award, Loader2, MessageCircle } from 'lucide-react';
import api from '../services/api';
import './DailyInterviewWidget.css';

const DAILY_QUESTIONS = [
    "Sınırsız bütçen olsa kuracağın ilk girişim ne olurdu?",
    "Bugüne kadar aldığın en garip ama işe yarayan tavsiye neydi?",
    "Bir mülakatta sorabileceğin en ters köşe soru nedir?",
    "Mesleğini hiç bilmeyen birine 3 kelimeyle nasıl anlatırsın?",
    "Özgeçmişine yazamadığın ama en çok gurur duyduğun başarın ne?",
    "Sence geleceğin en popüler yeteneği ne olacak ve neden?",
    "Bir zaman makinen olsa kariyerinin hangi anına gidip neyi değiştirirdin?"
];

const DailyInterviewWidget = ({ user }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [question, setQuestion] = useState("");
    const recognitionRef = useRef(null);
    
    // Time logic
    const isAfter19 = new Date().getHours() >= 19;
    const [winners, setWinners] = useState([]);
    const [loadingWinners, setLoadingWinners] = useState(false);

    useEffect(() => {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuestion(DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length]);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (isAfter19 && winners.length === 0) {
                fetchWinners();
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isAfter19]);

    const fetchWinners = async () => {
        setLoadingWinners(true);
        try {
            const data = await api.getDailyWinners();
            setWinners(data || []);
        } catch (error) {
            console.error('Error fetching winners:', error);
        } finally {
            setLoadingWinners(false);
        }
    };

    const startRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Chrome, Edge veya Safari kullanın.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'tr-TR';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
            }
        };

        recognitionRef.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleSubmit = async () => {
        if (!transcript.trim()) return;
        setIsAnalyzing(true);
        
        try {
            await api.submitDailyAnswer(question, transcript);
            setResult({
                score: 100,
                feedback: "Harika! Yanıtınız alındı. Sonuçlar akşam 19:00'da açıklanacak, lütfen tekrar kontrol edin!"
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Yanıtınız gönderilirken bir hata oluştu. ' + (error.message || ''));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setTranscript('');
        setResult(null);
        if (isRecording) stopRecording();
    };

    const handleCardClick = () => {
        if (!user && !isAfter19) {
            navigate('/login');
            return;
        }
        setIsOpen(true);
    };

    return (
        <>
            <div className={`daily-interview-card ${isAfter19 ? 'winners-mode' : ''}`} onClick={handleCardClick}>
                <div className="daily-interview-content">
                    <div className="daily-interview-header">
                        <div className="daily-interview-icon" style={isAfter19 ? { background: '#f59e0b'} : {}}>
                            {isAfter19 ? <Award size={18} color="#fff" /> : <MessageCircle size={18} color="#fff" />}
                        </div>
                        <div className="daily-interview-titles">
                            <div className="daily-interview-badges">
                                <span className="badge-new" style={isAfter19 ? { background: '#fef3c7', color: '#b45309'} : {}}>
                                    {isAfter19 ? "SONUÇLAR" : "YENİ"}
                                </span>
                                {!isAfter19 && <span className="badge-gift">🎁 Sürpriz Hediye</span>}
                            </div>
                            <h3>{isAfter19 ? "Kazananlar Açıklandı" : "Günün Sorusu"}</h3>
                        </div>
                    </div>
                    <p className="daily-interview-question">"{question}"</p>
                </div>
                <div className="daily-interview-action">
                    <button className="btn-voice-reply">
                        {isAfter19 ? "Sonucu Gör" : "Cevapla"}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="interview-modal-overlay">
                    <div className="interview-modal">
                        <button className="close-btn" onClick={handleClose}><X size={24} /></button>
                        
                        {isAfter19 ? (
                            <div className="winners-view">
                                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Günün Kazananları</h2>
                                <p className="modal-question">"{question}"</p>
                                
                                {loadingWinners ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin" size={32} color="#10b981" /></div>
                                ) : winners.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        Henüz kazananlar seçilmemiş veya sonuçlar açıklanıyor...
                                    </div>
                                ) : (
                                    <div className="winners-list">
                                        {winners.map(w => (
                                            <div key={w.id} className={`winner-item rank-${w.rank}`}>
                                                <div className="winner-rank-badge">{w.rank}</div>
                                                <img 
                                                    src={w.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.user.name || 'U')}&background=random`} 
                                                    alt="Winner avatar" 
                                                    className="winner-avatar" 
                                                />
                                                <div className="winner-info">
                                                    <h4>{w.user.name ? `${w.user.name} ${w.user.surname || ''}`.trim() : 'İsimsiz Kullanıcı'}</h4>
                                                    <p>"{w.answer}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : !result ? (
                            <>
                                <h2>Günün Sorusu</h2>
                                <p className="modal-question">"{question}"</p>
                                
                                <div className="recording-area">
                                    <textarea 
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        placeholder="Cevabını buraya yaz..."
                                        rows={5}
                                    />
                                </div>
                                
                                <div className="modal-actions-row">
                                    <button 
                                        className={`mic-icon-btn ${isRecording ? 'recording' : ''}`}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        title={isRecording ? "Kaydı Durdur" : "Sesli Yanıtla"}
                                    >
                                        <Mic size={22} />
                                    </button>
                                    <button 
                                        className="submit-answer-btn" 
                                        onClick={handleSubmit}
                                        disabled={!transcript.trim() || isAnalyzing}
                                    >
                                        {isAnalyzing ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
                                        Gönder
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="interview-result">
                                <div className="success-icon-wrapper">
                                    <Award size={64} color="#10b981" />
                                </div>
                                <h2>Yanıtın Gönderildi!</h2>
                                <div className="feedback-box">
                                    <p style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: '500' }}>
                                        Harika yanıtın için teşekkürler. 🎉<br/><br/>
                                        Günün kazananı ve sürpriz hediyeler <b>saat 19:00'da</b> açıklanacak.<br/>
                                        Sonuçları görmek için o saatte tekrar uğramayı unutma!
                                    </p>
                                </div>
                                <button className="btn-done" onClick={handleClose}>Tamamla</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default DailyInterviewWidget;
