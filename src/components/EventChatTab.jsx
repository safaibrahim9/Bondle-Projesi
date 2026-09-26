import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Edit2, Trash2, Reply, X, BarChart2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import UserAvatar from './UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import './EventChatTab.css';
import AgoraRTM from 'agora-rtm-sdk';
const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

const EventChatTab = ({ eventId, isRegistered, user, onRegisterClick }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Advanced chat states
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState([{id: 1, text: ''}, {id: 2, text: ''}]);

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const hoverTimeouts = useRef({});
    const rtmClientRef = useRef(null);

    // Initial fetch and Realtime setup
    useEffect(() => {
        let isMounted = true;
        
        fetchMessages();
        
        const initRtm = async () => {
            if (!user || !user.id || !APP_ID) return;
            try {
                const response = await api.getMeetingToken(`event-${eventId}`);
                const rtmClient = new AgoraRTM.RTM(APP_ID, user.id.toString());
                rtmClientRef.current = rtmClient;
                
                const tokenToUse = response.rtmToken || response.token;
                await rtmClient.login({ token: tokenToUse });
                
                const channelName = `event-${eventId}-chat`;
                await rtmClient.subscribe(channelName, { withMessage: true });
                
                rtmClient.addEventListener('message', async (event) => {
                    if (!isMounted) return;
                    const { message, publisher } = event;
                    if (publisher === user.id.toString()) return; // Ignore own messages
                    
                    // We received a real-time trigger, let's fetch messages to get the updated DB state
                    // (This ensures we get full objects with user info, replyTo, etc without sending huge payloads in RTM)
                    fetchMessages(false);
                });
            } catch (err) {
                console.error('RTM Init Error in Chat:', err);
            }
        };

        initRtm();

        return () => {
            isMounted = false;
            if (rtmClientRef.current) {
                rtmClientRef.current.logout().catch(console.error);
            }
        };
    }, [eventId, user]);

    const fetchMessages = async (showLoading = true) => {
        if (showLoading && messages.length === 0) setLoading(true);
        try {
            const data = await api.getEventMessages(eventId);
            setMessages((prevMessages) => {
                // If length is different or the latest stringified data is different, update it.
                // A better approach for React would be just returning `data` if we don't care about identical object references, 
                // but to avoid scroll jumping, we only scroll if it's a new message addition.
                const isNewMessage = prevMessages.length < data.length;
                if (isNewMessage || JSON.stringify(prevMessages) !== JSON.stringify(data)) {
                    if (isNewMessage) {
                        setTimeout(scrollToBottom, 100);
                    }
                    return data;
                }
                return prevMessages;
            });
        } catch (err) {
            console.error('Mesajlar yüklenemedi:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isRegistered) return;

        setSubmitting(true);
        try {
            if (editingMessageId) {
                const updatedMsg = await api.editEventMessage(eventId, editingMessageId, newMessage);
                setMessages(prev => prev.map(m => m.id === editingMessageId ? updatedMsg : m));
                setEditingMessageId(null);
            } else {
                const replyToId = replyingToMessage ? replyingToMessage.id : null;
                const sentMsg = await api.postEventMessage(eventId, newMessage, replyToId);
                setMessages(prev => [...prev, sentMsg]);
                setReplyingToMessage(null);
                setTimeout(scrollToBottom, 100);
            }
            setNewMessage('');
            
            // Notify other clients via RTM
            if (rtmClientRef.current) {
                rtmClientRef.current.publish(`event-${eventId}-chat`, 'update_chat').catch(console.error);
            }
        } catch (err) {
            console.error('Mesaj gönderilemedi:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (window.confirm('Bu mesajı silmek istediğine emin misin?')) {
            try {
                await api.deleteEventMessage(eventId, messageId);
                // Optimistically update
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, content: 'Bu mesaj silindi' } : m));
                
                if (rtmClientRef.current) {
                    rtmClientRef.current.publish(`event-${eventId}-chat`, 'update_chat').catch(console.error);
                }
            } catch (err) {
                console.error('Silme hatası:', err);
            }
        }
    };

    const handleEditClick = (msg) => {
        setEditingMessageId(msg.id);
        setNewMessage(msg.content);
        setReplyingToMessage(null); // Cancel reply if editing
    };

    const handleReplyClick = (msg) => {
        setReplyingToMessage(msg);
        setEditingMessageId(null); // Cancel edit if replying
        document.querySelector('.chat-input-field')?.focus();
    };

    const handleCancelEditOrReply = () => {
        setEditingMessageId(null);
        setReplyingToMessage(null);
        setNewMessage('');
    };

    const handleCreatePoll = async () => {
        if (!pollQuestion.trim() || pollOptions.some(o => !o.text.trim())) {
            alert('Lütfen soruyu ve tüm seçenekleri doldurun.');
            return;
        }
        
        const optionsPayload = pollOptions.map((o, idx) => ({ id: idx + 1, text: o.text }));
        setSubmitting(true);
        try {
            const sentMsg = await api.postEventMessage(eventId, pollQuestion, null, true, optionsPayload);
            setMessages(prev => [...prev, sentMsg]);
            setShowPollModal(false);
            setPollQuestion('');
            setPollOptions([{id: 1, text: ''}, {id: 2, text: ''}]);
            setTimeout(scrollToBottom, 100);
            
            if (rtmClientRef.current) {
                rtmClientRef.current.publish(`event-${eventId}-chat`, 'update_chat').catch(console.error);
            }
        } catch (err) {
            console.error('Anket oluşturulamadı:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVotePoll = async (messageId, currentVotes, optionId) => {
        const myVotesObj = currentVotes || {};
        let myVotes = myVotesObj[`user_${user?.id}`] || [];
        
        // Multiple choice toggle
        if (myVotes.includes(optionId)) {
            myVotes = myVotes.filter(id => id !== optionId);
        } else {
            myVotes = [...myVotes, optionId];
        }

        try {
            const updatedMsg = await api.voteEventPoll(eventId, messageId, myVotes);
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMsg : m));
            
            if (rtmClientRef.current) {
                rtmClientRef.current.publish(`event-${eventId}-chat`, 'update_chat').catch(console.error);
            }
        } catch (err) {
            console.error('Oy verilemedi:', err);
        }
    };

    const addPollOption = () => {
        setPollOptions(prev => [...prev, { id: prev.length + 1, text: '' }]);
    };
    const updatePollOption = (id, text) => {
        setPollOptions(prev => prev.map(o => o.id === id ? { ...o, text } : o));
    };

    const renderPoll = (msg) => {
        const votes = msg.pollVotes || {};
        let totalVotes = 0;
        const optionVoteCounts = {};
        
        // Calculate total and per-option counts
        Object.values(votes).forEach(userVotes => {
            if (Array.isArray(userVotes)) {
                userVotes.forEach(optId => {
                    optionVoteCounts[optId] = (optionVoteCounts[optId] || 0) + 1;
                    totalVotes++;
                });
            }
        });

        const myVotes = votes[`user_${user?.id}`] || [];

        return (
            <div className="chat-poll-container">
                <div className="chat-poll-question"><BarChart2 size={16} /> {msg.content}</div>
                <div className="chat-poll-options">
                    {msg.pollOptions?.map(opt => {
                        const count = optionVoteCounts[opt.id] || 0;
                        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isVotedByMe = myVotes.includes(opt.id);

                        return (
                            <div 
                                key={opt.id} 
                                className={`chat-poll-option ${isVotedByMe ? 'voted' : ''}`}
                                onClick={() => handleVotePoll(msg.id, msg.pollVotes, opt.id)}
                            >
                                <div className="chat-poll-progress" style={{ width: `${percentage}%` }}></div>
                                <div className="chat-poll-option-content">
                                    <span className="chat-poll-option-text">
                                        {isVotedByMe && <CheckCircle2 size={14} className="poll-check-icon" />}
                                        {opt.text}
                                    </span>
                                    <span className="chat-poll-option-percent">{percentage}% ({count})</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="chat-poll-footer">
                    Toplam {totalVotes} oy
                </div>
            </div>
        );
    };

    return (
        <div className="event-chat-container">
            <div className={`chat-messages-area ${!isRegistered ? 'blurred-area' : ''}`} ref={scrollContainerRef}>
                {loading && messages.length === 0 ? (
                    <div className="chat-loading">Yükleniyor...</div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">
                        Henüz hiç mesaj yok. İlk mesajı sen gönder!
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = user && msg.userId === user.id;
                        
                        return (
                            <div key={msg.id || idx} className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'} ${msg.isDeleted ? 'deleted' : ''}`}>
                                {!isMine && <UserAvatar user={msg.user} size="sm" />}
                                <div className="chat-bubble-content">
                                    {!isMine && <span className="chat-sender-name">{msg.user?.name} {msg.user?.surname}</span>}
                                    
                                    <div className="chat-bubble-box">
                                        {msg.replyTo && !msg.isDeleted && (
                                            <div className="chat-reply-banner" onClick={() => {
                                                // Could scroll to original message here
                                            }}>
                                                <div className="reply-banner-name">{msg.replyTo.user?.name}</div>
                                                <div className="reply-banner-text">{msg.replyTo.content}</div>
                                            </div>
                                        )}
                                        
                                        <div className="chat-bubble">
                                            {msg.isDeleted ? (
                                                <span className="deleted-text">🚫 Bu mesaj silindi</span>
                                            ) : msg.isPoll ? (
                                                renderPoll(msg)
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        
                                        {!msg.isDeleted && (
                                            <div className="chat-actions">
                                                <button title="Yanıtla" onClick={() => handleReplyClick(msg)}><Reply size={14}/></button>
                                                {isMine && !msg.isPoll && (
                                                    <button title="Düzenle" onClick={() => handleEditClick(msg)}><Edit2 size={14}/></button>
                                                )}
                                                {isMine && (
                                                    <button title="Sil" onClick={() => handleDeleteMessage(msg.id)}><Trash2 size={14}/></button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="chat-timestamp">
                                        {msg.isEdited && !msg.isDeleted && <span className="edited-tag">(Düzenlendi)</span>}
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: tr })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {!isRegistered ? (
                <div className="chat-fomo-overlay">
                    <div className="fomo-card">
                        <Lock size={32} color="var(--color-primary)" />
                        <h4>Sohbete Katılmak İster misin?</h4>
                        <p>Sohbetin tamamını görmek ve gruba mesaj yazmak için etkinliğe kayıt olmalısın.</p>
                        <button className="btn btn-primary btn-block" onClick={onRegisterClick}>
                            Hemen Kayıt Ol
                        </button>
                    </div>
                </div>
            ) : (
                <div className="chat-input-wrapper">
                    {(replyingToMessage || editingMessageId) && (
                        <div className="chat-input-header">
                            <div className="chat-input-header-content">
                                {replyingToMessage ? (
                                    <>
                                        <Reply size={14} /> <strong>{replyingToMessage.user?.name}</strong> kullanıcısına yanıt veriliyor
                                    </>
                                ) : (
                                    <>
                                        <Edit2 size={14} /> Mesaj düzenleniyor
                                    </>
                                )}
                            </div>
                            <button className="cancel-action-btn" onClick={handleCancelEditOrReply}><X size={16} /></button>
                        </div>
                    )}
                    
                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <button 
                            type="button" 
                            className="chat-poll-btn" 
                            title="Anket Oluştur"
                            onClick={() => setShowPollModal(true)}
                        >
                            <BarChart2 size={20} />
                        </button>
                        <input
                            type="text"
                            placeholder={editingMessageId ? "Mesajı düzenle..." : "Bir şeyler yaz..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={submitting}
                            className="chat-input-field"
                        />
                        <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() || submitting}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}

            {showPollModal && (
                <div className="chat-poll-modal-overlay">
                    <div className="chat-poll-modal">
                        <div className="poll-modal-header">
                            <h3>Anket Oluştur</h3>
                            <button onClick={() => setShowPollModal(false)}><X size={20}/></button>
                        </div>
                        <div className="poll-modal-body">
                            <input 
                                type="text" 
                                placeholder="Sorunuzu buraya yazın..." 
                                className="input"
                                value={pollQuestion}
                                onChange={e => setPollQuestion(e.target.value)}
                            />
                            
                            <div className="poll-options-list">
                                {pollOptions.map((opt, idx) => (
                                    <input 
                                        key={opt.id}
                                        type="text"
                                        placeholder={`${idx + 1}. Seçenek`}
                                        className="input"
                                        value={opt.text}
                                        onChange={e => updatePollOption(opt.id, e.target.value)}
                                    />
                                ))}
                            </div>
                            <button className="btn btn-outline btn-sm add-option-btn" onClick={addPollOption} type="button">
                                + Seçenek Ekle
                            </button>
                        </div>
                        <div className="poll-modal-footer">
                            <button className="btn btn-primary btn-block" onClick={handleCreatePoll} disabled={submitting}>
                                {submitting ? 'Oluşturuluyor...' : 'Anketi Gönder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventChatTab;
