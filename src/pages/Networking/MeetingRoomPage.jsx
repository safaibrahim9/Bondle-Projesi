import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PhoneOff, Clock, MessageSquare, X, Mic, MicOff, Video, VideoOff, Info, AlertTriangle, Users, Monitor } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import VirtualBackgroundExtension from 'agora-extension-virtual-background';
import api from '../../services/api';
import { Settings, Image as ImageIcon, Sparkles, User as UserIcon, Send, Smile } from 'lucide-react';


let popAudioContext = null;
const playEmojiSound = (emoji) => {
    try {
        if (!popAudioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            popAudioContext = new AudioContext();
        }
        if (popAudioContext.state === 'suspended') {
            popAudioContext.resume();
        }
        const ctx = popAudioContext;
        const now = ctx.currentTime;
        
        const createOsc = (type, freq, time, duration, vol = 0.2) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            osc.start(time);
            osc.stop(time + duration);
        };

        switch (emoji) {
            case '👍': // İki tonlu yükselen ses
                createOsc('sine', 400, now, 0.1);
                createOsc('sine', 600, now + 0.1, 0.15);
                break;
            case '❤️': // Kalp atışı (tok bas sesi)
                createOsc('sine', 60, now, 0.2, 0.5);
                createOsc('sine', 60, now + 0.3, 0.3, 0.5);
                break;
            case '👏': // Alkış (hızlı ardaşık patlamalar/şıkırtı)
                for (let i = 0; i < 5; i++) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(1000 + Math.random()*500, now + i*0.05);
                    gain.gain.setValueAtTime(0.1, now + i*0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i*0.05 + 0.04);
                    osc.start(now + i*0.05);
                    osc.stop(now + i*0.05 + 0.04);
                }
                break;
            case '😂': // Gülme (aşağı doğru inen hızlı notalar)
                for (let i = 0; i < 4; i++) {
                    createOsc('triangle', 800 - i*100, now + i*0.1, 0.08, 0.15);
                }
                break;
            case '😮': // Wow (yukarı kayan ses)
                {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                }
                break;
            case '🎉': // Parti (patlama + çan/zil sesi)
                createOsc('sawtooth', 2000, now, 0.1, 0.1);
                createOsc('square', 1500, now, 0.1, 0.1);
                createOsc('sine', 800, now + 0.1, 0.3, 0.15);
                createOsc('sine', 1200, now + 0.1, 0.3, 0.1);
                break;
            default: // Standart pop
                {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                    osc.start(now);
                    osc.stop(now + 0.15);
                }
                break;
        }
    } catch (e) {}
};

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

const MeetingRoomPage = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // States
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState('Hazırlanıyor...');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const isChatOpenRef = useRef(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [returnMessage, setReturnMessage] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
        if (isChatOpen) setUnreadCount(0);
    }, [isChatOpen]);
    
    // Agora States
    const [localTracks, setLocalTracks] = useState({ videoTrack: null, audioTrack: null });
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoOff, setIsVideoOff] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    
    // Virtual Background States
    const [vbExtension, setVbExtension] = useState(null);
    const [vbProcessor, setVbProcessor] = useState(null);
    const [vbType, setVbType] = useState('none'); // 'none', 'blur', 'image'
    const [vbLoading, setVbLoading] = useState(false);
    const [showVbMenu, setShowVbMenu] = useState(false);
    const [pinnedParticipant, setPinnedParticipant] = useState(null);
    const [activeSpeakers, setActiveSpeakers] = useState([]);

    // Chat States
    const [mainMessages, setMainMessages] = useState([]);
    const [breakoutMessages, setBreakoutMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const rtmClientRef = useRef(null);
    const rtmChannelRef = useRef(null);
    const activeChatChannelRef = useRef(null);

    const clientRef = useRef(null);
    const screenClientRef = useRef(null);
    const initStartedRef = useRef(false);
    const timerIntervalRef = useRef();
    const [accumulatedTime, setAccumulatedTime] = useState(0);
    const [intervalStart, setIntervalStart] = useState(null);
    const [durationLimit, setDurationLimit] = useState(null); 
    const [meetingTitle, setMeetingTitle] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState(null);
    const isDurationUnlimited = durationLimit === 0 || durationLimit === "0";
    const LIMIT = meetingId.startsWith('event-') || isDurationUnlimited ? Infinity : ((durationLimit ? durationLimit : (user?.isPremium ? 9999 : 25)) * 60 * 1000);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Breakout Rooms (Circle) States
    const [isHost, setIsHost] = useState(false);
    const [showBreakoutModal, setShowBreakoutModal] = useState(false);
    const [breakoutSize, setBreakoutSize] = useState(4);
    const [breakoutMode, setBreakoutMode] = useState('auto'); // 'auto' | 'manual'
    const [manualAssignments, setManualAssignments] = useState({}); // { [uid]: roomNum }
    const [manualRoomCount, setManualRoomCount] = useState(2);
    const [breakoutDuration, setBreakoutDuration] = useState(0); // in minutes, 0 = unlimited
    const [breakoutEndTime, setBreakoutEndTime] = useState(null); // timestamp when it ends
    const [remoteUserNames, setRemoteUserNames] = useState({}); // { [uid]: 'Name Surname' }
    const [remoteUserProfiles, setRemoteUserProfiles] = useState({});
    const [isInBreakout, setIsInBreakout] = useState(false);
    const [breakoutChannel, setBreakoutChannel] = useState(null);
    const [mainChannelRef, setMainChannelRef] = useState(null);
    const [meetingReactions, setMeetingReactions] = useState([]);
    const [showEmojiMenu, setShowEmojiMenu] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        if (!APP_ID) {
            alert('Sistem Hatası: VITE_AGORA_APP_ID ortam değişkeni bulunamadı. Lütfen Vercel ayarlarına ekleyin.');
            setLoadingStep('Hata: APP_ID Eksik');
            return;
        }
        
        if (!user || !user.id || initStartedRef.current) return;
        initStartedRef.current = true;

        // Auto-recovery timeout: if stuck for 10 seconds, try to force show UI
        const recoveryTimeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Initialization taking too long, forcing entry...');
                setLoading(false);
            }
        }, 12000);

        const initMeeting = async () => {
            try {
                setLoadingStep('Bağlantı kuruluyor...');
                if (!clientRef.current) {
                    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                }
                if (!screenClientRef.current) {
                    screenClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                }
                const client = clientRef.current;
                const screenClient = screenClientRef.current;

                setLoadingStep('Erişim izni alınıyor...');
                const response = await api.getMeetingToken(meetingId);
                if (!isMounted) return;
                if (!response || !response.token) throw new Error('Bilet alınamadı.');

                // Check if current user is an admin
                console.log('MeetingRoomPage User Role:', user?.role, 'Email:', user?.email);
                let isCurrentHost = false;
                if (user?.role === 'admin' || user?.email === 'ibrahimsafa1903@gmail.com') {
                    setIsHost(true);
                    isCurrentHost = true;
                }

                // Toplantı detaylarını çekip süreyi ayarla
                if (!meetingId.startsWith('event-')) {
                    try {
                        const meetingDetails = await api.getMeetingById(meetingId);
                        if (isMounted && meetingDetails) {
                            if (meetingDetails.durationLimit !== undefined && meetingDetails.durationLimit !== null) {
                                setDurationLimit(meetingDetails.durationLimit);
                            }
                            if (meetingDetails.title) {
                                setMeetingTitle(meetingDetails.title);
                            }
                            if (meetingDetails.otherUser) {
                                setPartnerInfo(meetingDetails.otherUser);
                            }
                        }
                    } catch (e) {
                        console.warn('Toplantı detayları alınamadı, varsayılan süre kullanılacak:', e);
                    }
                } else {
                    try {
                        const eventId = meetingId.replace('event-', '');
                        const eventDetails = await api.getEventById(eventId);
                        if (eventDetails && eventDetails.createdBy === user.id) {
                            setIsHost(true);
                            isCurrentHost = true;
                        }
                    } catch (e) { console.warn('Event detayları alınamadı', e); }
                }

                const channel = response.channelName || `meeting-${meetingId}`;
                const uid = user?.id || 0; 

                client.on('user-joined', (remoteUser) => {
                    console.log('User joined:', remoteUser.uid);
                    if (isMounted) {
                        setRemoteUsers(Array.from(client.remoteUsers));
                        setIntervalStart(prev => prev ? prev : Date.now());
                    }
                });

                client.on('user-left', (remoteUser) => {
                    if (isMounted) {
                        setRemoteUsers(Array.from(client.remoteUsers));
                        if (client.remoteUsers.length === 0 && !isCurrentHost) {
                            setIntervalStart(prevStart => {
                                if (prevStart) {
                                    setAccumulatedTime(prevAcc => prevAcc + (Date.now() - prevStart));
                                }
                                return null;
                            });
                        }
                    }
                });
                client.enableAudioVolumeIndicator();
                client.on("volume-indicator", (volumes) => {
                    const speakers = volumes.filter(v => v.level > 40).map(v => v.uid);
                    setActiveSpeakers(speakers);
                });

                client.on('user-published', async (remoteUser, mediaType) => {
                    try {
                        await client.subscribe(remoteUser, mediaType);
                        if (!isMounted) return;
                        if (mediaType === 'audio') {
                            remoteUser.audioTrack.play();
                        }
                        setRemoteUsers(Array.from(client.remoteUsers));
                    } catch (e) { console.error('Subscribe error:', e); }
                });

                client.on('user-unpublished', (remoteUser, mediaType) => {
                    if (isMounted) {
                        setRemoteUsers(Array.from(client.remoteUsers));
                    }
                });

                setLoadingStep('Odaya giriliyor...');
                await client.join(APP_ID, channel, response.token, uid);
                
                // Ekran paylaşımı için ikinci client'ı bağla
                if (response.screenToken && response.screenUid) {
                    try {
                        await screenClient.join(APP_ID, channel, response.screenToken, response.screenUid);
                    } catch (e) {
                        console.error('Screen client join error:', e);
                    }
                }

                if (!isMounted) {
                    await client.leave();
                    await screenClient.leave();
                    return;
                }
                
                // Odada zaten var olan kullanıcıları listeye ekle
                setRemoteUsers(Array.from(client.remoteUsers));

                // Eğer bekleme sırasında kullanıcı kamerasını veya mikrofonunu açtıysa şimdi yayınla
                try {
                    const tracksToPublish = [];
                    if (audioTrackRef.current) tracksToPublish.push(audioTrackRef.current);
                    if (videoTrackRef.current) tracksToPublish.push(videoTrackRef.current);
                    if (tracksToPublish.length > 0) {
                        await client.publish(tracksToPublish);
                    }
                } catch (publishErr) {
                    console.warn('Initial publish failed:', publishErr);
                }

                setLoadingStep('Gelişmiş özellikler yükleniyor...');
                // Virtual Background Setup (Non-blocking)
                try {
                    setVbLoading(true);
                    const extension = new VirtualBackgroundExtension();
                    AgoraRTC.registerExtensions([extension]);
                    setVbExtension(extension);
                    
                    const processor = extension.createProcessor();
                    // Load WASM files from CDN to ensure they are found
                    await processor.init('https://web-cdn.agora.io/sdk-extensions/virtual-background/wasms');
                    setVbProcessor(processor);
                    console.log('Virtual Background initialized from CDN');
                } catch (vbErr) {
                    console.error('Virtual Background failed to initialize:', vbErr);
                } finally {
                    setVbLoading(false);
                }

                // RTM Setup (Non-blocking)
                try {
                    const rtmClient = new AgoraRTM.RTM(APP_ID, user.id.toString());
                    rtmClientRef.current = rtmClient;
                    rtmChannelRef.current = channel;
                    
                    // Use rtmToken if available, otherwise token
                    const tokenToUse = response.rtmToken || response.token;
                    await rtmClient.login({ token: tokenToUse });
                    console.log('RTM logged in');
                    
                    // Subscribe to the shared channel to receive messages
                    await rtmClient.subscribe(channel, { withMessage: true, withPresence: true });
                    
                    rtmClient.addEventListener('message', async (event) => {
                        const { message, publisher, channelName } = event;
                        
                        if (publisher === user.id.toString()) return; // Gönderenin kendi mesajını yoksay
                        
                        const currentTargetChannel = activeChatChannelRef.current || rtmChannelRef.current;
                        
                        // Parse JSON if possible
                        let payload = null;
                        try {
                            payload = JSON.parse(message);
                        } catch (e) {
                            console.error('RTM message parse error:', e);
                        }
                        
                        if (!payload) {
                            const newMsg = {
                                sender: remoteUserNames[publisher] || `Katılımcı`,
                                text: message,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                            if (channelName && channelName !== rtmChannelRef.current) {
                                setBreakoutMessages(prev => [...prev, newMsg]);
                            } else {
                                setMainMessages(prev => [...prev, newMsg]);
                            }
                            setUnreadCount(prev => prev + 1);
                        }

                        // Eğer mesaj farklı bir kanaldan geldiyse (örn. main channel'dayken breakout veya breakout'tayken main)
                        if (channelName && channelName !== currentTargetChannel) {
                            // Sadece START_CIRCLE ve END_CIRCLE komutlarına izin ver
                            if (!payload || (payload.type !== 'START_CIRCLE' && payload.type !== 'END_CIRCLE')) {
                                return; 
                            }
                        }

                        if (payload) {
                            if (payload.type === 'REACTION' && payload.emoji) {
                                const newReaction = {
                                    id: Date.now() + Math.random(),
                                    emoji: payload.emoji,
                                    senderId: publisher
                                };
                                playEmojiSound(payload.emoji);
                                setMeetingReactions(prev => [...prev, newReaction]);
                                setTimeout(() => {
                                    setMeetingReactions(prev => prev.filter(r => r.id !== newReaction.id));
                                }, 2500);
                                return;
                            } else if (payload.type === 'START_CIRCLE' && payload.assignments) {
                                const myAssignment = payload.assignments[user.id.toString()];
                                if (myAssignment) {
                                    setBreakoutChannel(myAssignment);
                                    setIsInBreakout(true);
                                    if (payload.endTime) setBreakoutEndTime(payload.endTime);
                                    
                                    // RTM Switch
                                    setBreakoutMessages([]);
                                    // DO NOT unsubscribe from main channel so we can receive END_CIRCLE
                                    try {
                                        await rtmClientRef.current.subscribe(myAssignment, { withMessage: true, withPresence: true });
                                        activeChatChannelRef.current = myAssignment;
                                    } catch(e) {}

                                    // Pause timer before leaving
                                    setIntervalStart(prevStart => {
                                        if (prevStart) setAccumulatedTime(prevAcc => prevAcc + (Date.now() - prevStart));
                                        return null;
                                    });

                                    // Switch RTC Channel
                                    await clientRef.current.leave();
                                    setRemoteUsers([]); // MUST clear users on channel switch
                                    
                                    // Fetch token for the new channel
                                    try {
                                        const breakoutTokenRes = await api.getMeetingToken(myAssignment);
                                        await clientRef.current.join(APP_ID, myAssignment, breakoutTokenRes.token, uid);
                                        if (clientRef.current.remoteUsers.length > 0 || isCurrentHost) {
                                            setIntervalStart(prev => prev ? prev : Date.now());
                                        }
                                        if (breakoutTokenRes.screenToken && breakoutTokenRes.screenUid) {
                                            await screenClientRef.current.leave();
                                            await screenClientRef.current.join(APP_ID, myAssignment, breakoutTokenRes.screenToken, breakoutTokenRes.screenUid);
                                        }
                                    } catch (tokenErr) {
                                        console.error('Failed to get token for breakout room:', tokenErr);
                                        return;
                                    }
                                    
                                    // Republish tracks
                                    try {
                                        const tracksToPublish = [];
                                        if (audioTrackRef.current) tracksToPublish.push(audioTrackRef.current);
                                        if (videoTrackRef.current) tracksToPublish.push(videoTrackRef.current);
                                        if (tracksToPublish.length > 0) {
                                            await clientRef.current.publish(tracksToPublish);
                                        }
                                    } catch (publishErr) {
                                        console.warn('Breakout republish failed:', publishErr);
                                    }
                                }
                                return;
                            } else if (payload.type === 'END_CIRCLE') {
                                setReturnMessage('Oda yöneticisi toplantıyı ana odaya alıyor, yönlendiriliyorsunuz...');
                                setTimeout(async () => {
                                    setReturnMessage('');
                                    setIsInBreakout(false);
                                    setBreakoutChannel(null);
                                    setBreakoutEndTime(null);
                                    
                                    // RTM Switch
                                    if (activeChatChannelRef.current && activeChatChannelRef.current !== rtmChannelRef.current) {
                                        try { await rtmClientRef.current.unsubscribe(activeChatChannelRef.current); } catch(e) {}
                                    }
                                    activeChatChannelRef.current = null;
                                    
                                    // Pause timer before leaving
                                    setIntervalStart(prevStart => {
                                        if (prevStart) setAccumulatedTime(prevAcc => prevAcc + (Date.now() - prevStart));
                                        return null;
                                    });

                                    // Switch back to main RTC Channel
                                    await clientRef.current.leave();
                                    setRemoteUsers([]); // MUST clear users on channel switch
                                    
                                    try {
                                        const mainTokenRes = await api.getMeetingToken(meetingId);
                                        const mainChannelName = mainTokenRes.channelName || (meetingId.startsWith('event-') ? meetingId : `meeting-${meetingId}`);
                                        await clientRef.current.join(APP_ID, mainChannelName, mainTokenRes.token, uid);
                                        const realUsersCount = Array.from(clientRef.current.remoteUsers).filter(u => Number(u.uid) < 1000000).length;
                                        if (realUsersCount > 0 || isCurrentHost) {
                                            setIntervalStart(prev => prev ? prev : Date.now());
                                        }
                                        if (mainTokenRes.screenToken && mainTokenRes.screenUid) {
                                            await screenClientRef.current.leave();
                                            await screenClientRef.current.join(APP_ID, mainChannelName, mainTokenRes.screenToken, mainTokenRes.screenUid);
                                        }
                                    } catch (tokenErr) {
                                        console.error('Failed to get token for main room:', tokenErr);
                                        return;
                                    }
                                    
                                    // Republish tracks
                                    try {
                                        const tracksToPublish = [];
                                        if (audioTrackRef.current) tracksToPublish.push(audioTrackRef.current);
                                        if (videoTrackRef.current) tracksToPublish.push(videoTrackRef.current);
                                        if (tracksToPublish.length > 0) {
                                            await clientRef.current.publish(tracksToPublish);
                                        }
                                    } catch (publishErr) {
                                        console.warn('Main republish failed:', publishErr);
                                    }
                                }, 3000);
                                return;
                            }
                        }
                        
                        if (!payload) {
                            setMessages(prev => [...prev, {
                                sender: 'Partner',
                                publisherId: publisher,
                                text: message,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            
                            if (!isChatOpenRef.current) {
                                setUnreadCount(prev => prev + 1);
                            }
                        }
                    });
                } catch (rtmErr) {
                    console.error('RTM Initialization failed:', rtmErr);
                }

                // Tracks will be published when the user toggles them on.

                // Log JOIN event
                await api.logMeetingEvent(meetingId, 'join');

                if (isMounted) {
                    setLoadingStep('');
                    setLoading(false);
                    clearTimeout(recoveryTimeout);
                    
                    // Backend'den gelen birikmiş süre ve (eğer o an oda doluysa) interval başlangıcını al
                    if (response.accumulatedTime !== undefined) {
                        setAccumulatedTime(response.accumulatedTime || 0);
                    }
                    if (response.intervalStart) {
                        setIntervalStart(new Date(response.intervalStart).getTime());
                    } else if (client.remoteUsers.length > 0 || isCurrentHost) {
                        // Eğer backend intervalStart dönmediyse ama odada biri varsa şimdi başlat
                        setIntervalStart(Date.now());
                    }
                }
            } catch (err) {
                console.error('Agora Detaylı Hata:', err);
                if (isMounted) {
                    setLoadingStep('');
                    setLoading(false);
                    if (err.message !== 'WS_ABORT' && err.code !== 'WS_ABORT') {
                        alert('Bağlantı hatası: ' + err.message);
                        navigate('/');
                    }
                }
            }
        };

        initMeeting();
        
        return () => {
            isMounted = false;
            initStartedRef.current = false;
            clearTimeout(recoveryTimeout);
            clearInterval(timerIntervalRef.current);
            const oldClient = clientRef.current;
            const oldScreenClient = screenClientRef.current;
            const oldAudio = audioTrackRef.current;
            const oldVideo = videoTrackRef.current;
            const oldRtmClient = rtmClientRef.current;
            
            clientRef.current = null;
            screenClientRef.current = null;
            audioTrackRef.current = null;
            videoTrackRef.current = null;
            rtmClientRef.current = null;

            const cleanup = async () => {
                if (oldAudio) { oldAudio.stop(); oldAudio.close(); }
                if (oldVideo) { oldVideo.stop(); oldVideo.close(); }
                
                if (oldClient) {
                    try {
                        if (oldClient.connectionState === 'CONNECTED' || oldClient.connectionState === 'CONNECTING') {
                            await oldClient.leave();
                        }
                    } catch (e) {
                        console.error('Leave error:', e);
                    }
                }

                if (oldScreenClient) {
                    try {
                        if (oldScreenClient.connectionState === 'CONNECTED' || oldScreenClient.connectionState === 'CONNECTING') {
                            await oldScreenClient.leave();
                        }
                    } catch (e) {}
                }
                
                // Log LEAVE event
                try {
                    await api.logMeetingEvent(meetingId, 'leave');
                } catch (e) {
                    console.warn('Leave event could not be logged:', e);
                }
                
                if (oldRtmClient) {
                    try {
                        await oldRtmClient.logout();
                    } catch (e) { console.error('RTM Logout error:', e); }
                }
                initStartedRef.current = false;
            };
            cleanup();
        };
    }, [meetingId, user?.id]);

    useEffect(() => {
        timerIntervalRef.current = setInterval(() => {
            const passed = accumulatedTime + (intervalStart ? Date.now() - intervalStart : 0);
            setElapsedTime(passed);
            
            if (LIMIT !== Infinity && !user?.isPremium && LIMIT - passed <= 60000 && LIMIT - passed > 0) {
                setShowWarning(true);
            }

            if (LIMIT !== Infinity && passed >= LIMIT && !loading) {
                clearInterval(timerIntervalRef.current);
                alert('Görüşme süresi doldu.');
                api.completeMeeting(meetingId).catch(e => console.error('Error completing meeting:', e)).finally(() => {
                    handleLeaveMeeting();
                });
            }
        }, 1000);
        return () => clearInterval(timerIntervalRef.current);
    }, [accumulatedTime, intervalStart, user, loading]);

    // Breakout Countdown Timer Effect
    useEffect(() => {
        if (!isInBreakout || !breakoutEndTime) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = breakoutEndTime - now;
            
            if (remaining <= 10000 && remaining > 9000) {
                setReturnMessage('Süre dolmak üzere, birazdan ana odaya döneceksiniz...');
                setTimeout(() => setReturnMessage(''), 8000);
            }
            
            if (now >= breakoutEndTime) {
                // Süre doldu, otomatik olarak ana odaya dön
                clearInterval(interval);
                setReturnMessage('Süre doldu, ana odaya yönlendiriliyorsunuz...');
                setTimeout(() => {
                    setReturnMessage('');
                    handleReturnToMainRoom();
                }, 3000);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isInBreakout, breakoutEndTime]);

    // Fetch names for remote users
    useEffect(() => {
        remoteUsers.forEach(u => {
            const originalUid = u.uid > 1000000 ? u.uid - 1000000 : u.uid;
            if (!remoteUserNames[originalUid]) {
                api.getUserProfile(originalUid).then(profile => {
                    if (profile) {
                        setRemoteUserNames(prev => ({
                            ...prev,
                            [originalUid]: `${profile.name} ${profile.surname || ''}`.trim()
                        }));
                        setRemoteUserProfiles(prev => ({
                            ...prev,
                            [originalUid]: profile
                        }));
                    }
                }).catch(() => {});
            }
        });
    }, [remoteUsers, remoteUserNames]);

    // Ortak Ana Odaya Dönüş Fonksiyonu (Moderatör Topla derse veya süre biterse)
    const handleReturnToMainRoom = async () => {
        if (!isInBreakout) return;
        setIsInBreakout(false);
        setBreakoutChannel(null);
        setBreakoutEndTime(null);
        
        // RTM Switch
        if (activeChatChannelRef.current && activeChatChannelRef.current !== rtmChannelRef.current) {
            try { await rtmClientRef.current.unsubscribe(activeChatChannelRef.current); } catch(e) {}
        }
        activeChatChannelRef.current = null;
        try { await rtmClientRef.current.subscribe(rtmChannelRef.current, { withMessage: true, withPresence: true }); } catch(e) {}

        // Pause timer before leaving
        setIntervalStart(prevStart => {
            if (prevStart) setAccumulatedTime(prevAcc => prevAcc + (Date.now() - prevStart));
            return null;
        });

        try {
            await clientRef.current.leave();
            setRemoteUsers([]); // Clear state
            
            try {
                const mainTokenRes = await api.getMeetingToken(meetingId);
                const originalChannel = mainTokenRes.channelName || (meetingId.startsWith('event-') ? meetingId : `meeting-${meetingId}`);
                await clientRef.current.join(APP_ID, originalChannel, mainTokenRes.token, user.id);
                if (clientRef.current.remoteUsers.length > 0 || isHost) {
                    setIntervalStart(prev => prev ? prev : Date.now());
                }
            } catch (tokenErr) {
                console.error('Failed to get token for main room:', tokenErr);
            }
            
            const tracksToPublish = [];
            if (audioTrackRef.current) tracksToPublish.push(audioTrackRef.current);
            if (videoTrackRef.current && !isVideoOff) tracksToPublish.push(videoTrackRef.current);
            
            if (tracksToPublish.length > 0) {
                await clientRef.current.publish(tracksToPublish);
            }
        } catch (e) {
            console.error('Return to main room error:', e);
        }
    };

    const handleLeaveMeeting = async () => {
        if (audioTrackRef.current) { audioTrackRef.current.stop(); audioTrackRef.current.close(); audioTrackRef.current = null; }
        if (videoTrackRef.current) { videoTrackRef.current.stop(); videoTrackRef.current.close(); videoTrackRef.current = null; }
        if (screenTrackRef.current) { screenTrackRef.current.stop(); screenTrackRef.current.close(); screenTrackRef.current = null; }
        if (clientRef.current) await clientRef.current.leave();
        navigate('/');
    };

    const audioTrackRef = useRef(null);
    const videoTrackRef = useRef(null);
    const screenTrackRef = useRef(null);
    const screenAudioTrackRef = useRef(null);
    const wasVideoOffBeforeScreenShare = useRef(true);
    const isTogglingMicRef = useRef(false);
    const isTogglingVideoRef = useRef(false);

    const toggleMic = async () => {
        if (isTogglingMicRef.current) return;
        isTogglingMicRef.current = true;
        try {
            if (isMuted) {
                setLoadingStep('Mikrofon hazırlanıyor...');
                const track = await AgoraRTC.createMicrophoneAudioTrack();
                audioTrackRef.current = track;
                if (clientRef.current) {
                    try { await clientRef.current.publish(track); } catch (e) { console.warn(e); }
                }
                setIsMuted(false);
            } else {
                if (audioTrackRef.current) {
                    if (clientRef.current) {
                        try { await clientRef.current.unpublish(audioTrackRef.current); } catch (e) { console.warn(e); }
                    }
                    audioTrackRef.current.stop();
                    audioTrackRef.current.close();
                    audioTrackRef.current = null;
                }
                setIsMuted(true);
            }
        } catch (e) {
            console.error('Mic toggle error:', e);
            alert('Mikrofon erişimi sağlanamadı. Lütfen izinleri kontrol edin.');
        } finally {
            isTogglingMicRef.current = false;
            setLoadingStep('');
        }
    };

    const toggleVideo = async () => {
        if (isTogglingVideoRef.current) return;
        isTogglingVideoRef.current = true;
        try {
            if (isVideoOff) {
                setLoadingStep('Kamera hazırlanıyor...');
                const track = await AgoraRTC.createCameraVideoTrack();
                videoTrackRef.current = track;
                if (clientRef.current) {
                    try { await clientRef.current.publish(track); } catch (e) { console.warn(e); }
                }
                setIsVideoOff(false);
                
                // Retry play until the local-video div is available in DOM
                let retries = 0;
                const playWithRetry = () => {
                    if (!videoTrackRef.current) return;
                    const localDiv = document.getElementById('local-video');
                    if (localDiv) {
                        try { videoTrackRef.current.play('local-video'); } catch(e) { console.warn('Play error:', e); }
                        if (vbProcessor) {
                            try {
                                videoTrackRef.current.pipe(vbProcessor).pipe(videoTrackRef.current.processorDestination);
                            } catch (pErr) { console.warn('Pipe error:', pErr); }
                        }
                    } else if (retries < 15) {
                        retries++;
                        setTimeout(playWithRetry, 150);
                    }
                };
                setTimeout(playWithRetry, 100);
            } else {
                if (videoTrackRef.current) {
                    if (clientRef.current) {
                        try { await clientRef.current.unpublish(videoTrackRef.current); } catch (e) { console.warn(e); }
                    }
                    videoTrackRef.current.stop();
                    videoTrackRef.current.close();
                    videoTrackRef.current = null;
                }
                setIsVideoOff(true);
            }
        } catch (e) {
            console.error('Video toggle error:', e);
            alert('Kamera erişimi sağlanamadı. Lütfen izinleri kontrol edin.');
        } finally {
            isTogglingVideoRef.current = false;
            setLoadingStep('');
        }
    };

    useEffect(() => {
        // Layout değiştiğinde (Pinleme veya ekran paylaşımı açıldığında) 
        // DOM yeniden çizildiği için track'in yeni div'e tekrar bağlanması gerekir.
        const timer = setTimeout(() => {
            const localDiv = document.getElementById('local-video');
            const localScreenDiv = document.getElementById('local-screen-video');
            if (localScreenDiv && isScreenSharing && screenTrackRef.current) {
                try { screenTrackRef.current.play('local-screen-video'); } catch(e) {}
            }
            if (localDiv && !isVideoOff && videoTrackRef.current) {
                try { videoTrackRef.current.play('local-video'); } catch(e) {}
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [pinnedParticipant, isScreenSharing, isVideoOff, remoteUsers]);

    const toggleScreenShare = async () => {
        if (isTogglingVideoRef.current) return;
        isTogglingVideoRef.current = true;
        try {
            if (!isScreenSharing) {
                setLoadingStep('Ekran paylaşımı hazırlanıyor...');
                
                // Create screen track (video + optional audio) optimized for motion/video
                const track = await AgoraRTC.createScreenVideoTrack({ 
                    encoderConfig: '1080p_2', // 30 fps
                    optimizationMode: 'motion'
                }, "auto");
                
                let screenVideoTrack, screenAudioTrack;
                
                if (Array.isArray(track)) {
                    screenVideoTrack = track[0];
                    screenAudioTrack = track[1];
                } else {
                    screenVideoTrack = track;
                }
                
                screenTrackRef.current = screenVideoTrack;
                screenAudioTrackRef.current = screenAudioTrack;

                // Handle stop from browser's built-in "Stop sharing" UI
                screenVideoTrack.on("track-ended", async () => {
                    await stopScreenShare();
                });

                if (screenClientRef.current && screenClientRef.current.connectionState === 'CONNECTED') {
                    const tracksToPublish = [screenVideoTrack];
                    if (screenAudioTrack) tracksToPublish.push(screenAudioTrack);
                    try {
                        await screenClientRef.current.publish(tracksToPublish);
                    } catch (pubErr) {
                        console.error('Failed to publish screen track:', pubErr);
                    }
                } else {
                    console.error("Screen client is not connected!");
                }
                
                setIsScreenSharing(true);

                setTimeout(() => {
                    if (screenTrackRef.current) {
                        screenTrackRef.current.play('local-video');
                    }
                }, 100);

            } else {
                await stopScreenShare();
            }
        } catch (e) {
            console.error('Screen share error:', e);
            if (e.code !== 'NOT_SUPPORTED' && e.message !== 'Permission denied') {
                alert('Ekran paylaşımı başlatılamadı. İzinleri kontrol edin.');
            }
        } finally {
            isTogglingVideoRef.current = false;
            setLoadingStep('');
        }
    };

    const stopScreenShare = async () => {
        if (!screenTrackRef.current) return;
        
        try {
            if (screenClientRef.current) {
                const tracksToUnpublish = [screenTrackRef.current];
                if (screenAudioTrackRef.current) tracksToUnpublish.push(screenAudioTrackRef.current);
                try { await screenClientRef.current.unpublish(tracksToUnpublish); } catch(e){}
            }

            if (screenTrackRef.current) {
                screenTrackRef.current.stop();
                screenTrackRef.current.close();
                screenTrackRef.current = null;
            }
            if (screenAudioTrackRef.current) {
                screenAudioTrackRef.current.stop();
                screenAudioTrackRef.current.close();
                screenAudioTrackRef.current = null;
            }

            setIsScreenSharing(false);
            
            // Layout düzelmesi için hafif bekleme
            setTimeout(() => {
                const localDiv = document.getElementById('local-video');
                if (localDiv && !isVideoOff && videoTrackRef.current) {
                    try { videoTrackRef.current.play('local-video'); } catch(e){}
                }
            }, 100);
            
        } catch (e) {
            console.error('Error stopping screen share:', e);
        }
    };

    const handleVbChange = async (type, options = {}) => {
        const track = videoTrackRef.current;
        if (!vbProcessor || !track) return;
        
        try {
            if (type === 'none') {
                await vbProcessor.disable();
                setVbType('none');
            } else {
                // Ensure it's piped if it's the first time and camera is on
                if (!isVideoOff) {
                    try {
                        track.pipe(vbProcessor).pipe(track.processorDestination);
                    } catch (e) { /* might already be piped */ }
                }

                if (type === 'blur') {
                    await vbProcessor.setOptions({ type: 'blur', blurDegree: 3 });
                } else if (type === 'image') {
                    await vbProcessor.setOptions({ type: 'img', source: options.source });
                }
                
                await vbProcessor.enable();
                setVbType(type);
            }
        } catch (e) {
            console.error('Virtual background error:', e);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                handleVbChange('image', { source: img });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = async () => {
        const targetChannel = activeChatChannelRef.current || rtmChannelRef.current;
        if (!chatInput.trim() || !rtmClientRef.current || !targetChannel) return;
        
        try {
            await rtmClientRef.current.publish(targetChannel, chatInput);
            const newMsg = {
                sender: 'Me',
                text: chatInput,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            if (targetChannel && targetChannel !== rtmChannelRef.current) {
                setBreakoutMessages(prev => [...prev, newMsg]);
            } else {
                setMainMessages(prev => [...prev, newMsg]);
            }
            setChatInput('');
        } catch (e) {
            console.error('Send message error:', e);
        }
    };

    const formatRemainingTime = (ms) => {
        if (LIMIT === Infinity) return "Sınırsız";
        const remaining = LIMIT - ms;
        if (remaining <= 0) return "0:00";
        const s = Math.floor(remaining / 1000);
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    };

    const handleSendEmoji = (emoji) => {
        setShowEmojiMenu(false);
        const targetChannel = activeChatChannelRef.current || rtmChannelRef.current;
        if (rtmClientRef.current && targetChannel) {
            const payload = JSON.stringify({ type: 'REACTION', emoji });
            rtmClientRef.current.publish(targetChannel, payload).catch(()=>{});
        }
        
        playEmojiSound(emoji);
        const newReaction = { id: Date.now() + Math.random(), emoji, senderId: user?.id?.toString() };
        setMeetingReactions(prev => [...prev, newReaction]);
        setTimeout(() => {
            setMeetingReactions(prev => prev.filter(r => r.id !== newReaction.id));
        }, 2500);
    };

    const handleStartBreakout = async () => {
        if (!rtmClientRef.current || !rtmChannelRef.current) return;
        
        const allUsers = [user.id.toString(), ...remoteUsers.filter(u => Number(u.uid) < 1000000).map(u => u.uid.toString())];
        // Karıştır
        allUsers.sort(() => Math.random() - 0.5);
        
        const assignments = {};
        const roomPrefix = `event-${meetingId.replace('event-', '')}-circle-`;
        
        if (breakoutMode === 'auto') {
            let currentRoomIndex = 1;
            let currentRoomCount = 0;
            
            allUsers.forEach((u) => {
                assignments[u] = `${roomPrefix}${currentRoomIndex}`;
                currentRoomCount++;
                if (currentRoomCount >= breakoutSize) {
                    currentRoomIndex++;
                    currentRoomCount = 0;
                }
            });
        } else {
            // Manual Mode
            allUsers.forEach((u) => {
                const roomNum = manualAssignments[u] || 1; // Default to Room 1 if not assigned
                assignments[u] = `${roomPrefix}${roomNum}`;
            });
        }
        
        const endTime = breakoutDuration > 0 ? Date.now() + breakoutDuration * 60 * 1000 : null;
        
        const payload = JSON.stringify({
            type: 'START_CIRCLE',
            assignments: assignments,
            endTime: endTime
        });
        
        try {
            await rtmClientRef.current.publish(rtmChannelRef.current, payload);
            
            // Kendisini de yönlendir
            const myAssignment = assignments[user.id.toString()];
            if (myAssignment) {
                setBreakoutChannel(myAssignment);
                setIsInBreakout(true);
                if (endTime) setBreakoutEndTime(endTime);
                
                // RTM Switch
                setBreakoutMessages([]);
                // DO NOT unsubscribe from main channel so we can receive END_CIRCLE
                try {
                    await rtmClientRef.current.subscribe(myAssignment, { withMessage: true, withPresence: true });
                    activeChatChannelRef.current = myAssignment;
                } catch(e) {}

                // Pause timer before leaving
                setIntervalStart(prevStart => {
                    if (prevStart) setAccumulatedTime(prevAcc => prevAcc + (Date.now() - prevStart));
                    return null;
                });

                await clientRef.current.leave();
                setRemoteUsers([]); // Clear state for current user too
                
                try {
                    const breakoutTokenRes = await api.getMeetingToken(myAssignment);
                    await clientRef.current.join(APP_ID, myAssignment, breakoutTokenRes.token, user.id);
                    if (clientRef.current.remoteUsers.length > 0 || isHost) {
                        setIntervalStart(prev => prev ? prev : Date.now());
                    }
                } catch (tokenErr) {
                    console.error('Failed to get token for breakout room:', tokenErr);
                }
                
                const tracksToPublish = [];
                if (audioTrackRef.current) tracksToPublish.push(audioTrackRef.current);
                if (videoTrackRef.current) tracksToPublish.push(videoTrackRef.current);
                if (tracksToPublish.length > 0) await clientRef.current.publish(tracksToPublish);
            }
            
            setShowBreakoutModal(false);
        } catch (e) {
            console.error('Breakout error:', e);
            alert('Odalar oluşturulurken hata oluştu.');
        }
    };

    const handleEndBreakout = async () => {
        if (!rtmClientRef.current || !rtmChannelRef.current) return;
        
        const payload = JSON.stringify({ type: 'END_CIRCLE' });
        try {
            await rtmClientRef.current.publish(rtmChannelRef.current, payload);
            setReturnMessage('Katılımcılar ana odaya toplanıyor, yönlendiriliyorsunuz...');
            setTimeout(() => {
                setReturnMessage('');
                handleReturnToMainRoom();
            }, 3000);
        } catch (e) {
            console.error('End Breakout error:', e);
        }
    };

    const totalParticipants = remoteUsers.length + 1;
    let gridTemplate = '1fr';
    if (totalParticipants === 2) gridTemplate = '1fr 1fr';
    else if (totalParticipants >= 3 && totalParticipants <= 4) gridTemplate = '1fr 1fr';
    else if (totalParticipants >= 5 && totalParticipants <= 9) gridTemplate = 'repeat(3, 1fr)';
    else if (totalParticipants >= 10) gridTemplate = 'repeat(4, 1fr)';


    return (
        <div style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)', overflow: 'hidden', position: 'fixed', top: 0, left: 0, color: 'var(--color-text-primary)' }}>
            {showWarning && (
                <div style={{ 
                    position: 'fixed', 
                    top: isMobile ? '40px' : '20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: 'rgba(234, 67, 53, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    color: '#fff', 
                    padding: isMobile ? '12px 16px' : '12px 24px', 
                    borderRadius: '100px', 
                    zIndex: 1000, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    fontWeight: '500',
                    width: isMobile ? '90%' : 'auto',
                    maxWidth: '400px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={isMobile ? 18 : 20} />
                        <span style={{ lineHeight: '1.4' }}>Görüşmenin bitmesine son 1 dakikadan az kaldı!</span>
                    </div>
                    <button onClick={() => setShowWarning(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0, transition: 'background 0.2s' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {returnMessage && (
                <div style={{ 
                    position: 'fixed', 
                    top: isMobile ? '40px' : '20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: 'rgba(26, 115, 232, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    color: '#fff', 
                    padding: isMobile ? '12px 16px' : '12px 24px', 
                    borderRadius: '100px', 
                    zIndex: 1000, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    fontWeight: '500',
                    width: isMobile ? '90%' : 'auto',
                    maxWidth: '400px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Info size={isMobile ? 18 : 20} />
                        <span style={{ lineHeight: '1.4' }}>{returnMessage}</span>
                    </div>
                    <button onClick={() => setReturnMessage('')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0, transition: 'background 0.2s' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {showInfoModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid var(--color-border)' }}>
                        <button onClick={() => setShowInfoModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}><X size={20} /></button>
                        <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Info size={24} color="var(--color-accent-primary)" /> Toplantı Bilgileri</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--color-bg-tertiary)', padding: '15px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Toplantı Bağlantısı:</div>
                            <div style={{ background: 'var(--color-bg-primary)', padding: '12px', borderRadius: '8px', color: 'var(--color-text-primary)', wordBreak: 'break-all', fontSize: '0.85rem', border: '1px solid var(--color-border)', userSelect: 'all' }}>
                                {window.location.href}
                            </div>
                                        <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Bağlantı kopyalandı!'); }} style={{ background: 'var(--color-accent-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>Linki Kopyala</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '10px' : '15px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div onClick={() => setShowInfoModal(true)} style={{ background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', pointerEvents: 'auto' }} title="Toplantı Bilgisi">
                                    <Info size={20} />
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', color: '#fff', fontSize: '1rem', fontWeight: 'bold', pointerEvents: 'auto' }}>
                                    {isInBreakout ? 'Circle Odası' : meetingId.startsWith('event-') ? 'Ana Salon' : (meetingTitle || 'Birebir Görüşme')}
                                </div>
                                {!isInBreakout && LIMIT !== Infinity && (
                                    <div style={{ background: 'rgba(234, 67, 53, 0.8)', padding: '8px 16px', borderRadius: '20px', color: '#fff', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={16} /> 
                                        {formatRemainingTime(elapsedTime)}
                                    </div>
                                )}
                                {isInBreakout && breakoutEndTime && (
                                    <div style={{ background: 'rgba(26, 115, 232, 0.8)', padding: '8px 16px', borderRadius: '20px', color: '#fff', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={16} /> 
                                        {(() => {
                                            const r = breakoutEndTime - Date.now();
                                            if (r <= 0) return "0:00";
                                            const s = Math.floor(r / 1000);
                                            return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ 
                        flex: 1, 
                        display: (pinnedParticipant || isScreenSharing) ? 'flex' : 'grid', 
                        flexDirection: (pinnedParticipant || isScreenSharing) ? (isMobile ? 'column' : 'row') : undefined,
                        gridTemplateColumns: !(pinnedParticipant || isScreenSharing) ? (isMobile ? '1fr' : gridTemplate) : undefined,
                        gap: isMobile ? '10px' : '15px', 
                        justifyContent: 'center', 
                        alignContent: 'center',
                        overflowY: 'auto'
                    }}>
                        {(() => {
                            const togglePin = (uid) => setPinnedParticipant(prev => prev === uid ? null : uid);
                            
                            const allParticipants = [
                                { uid: 'local', isLocal: true, user: user, name: `${user?.name} ${user?.surname} (Siz)`, profilePicture: user?.profilePicture || user?.picture }
                            ];

                            if (isScreenSharing && screenTrackRef.current) {
                                allParticipants.push({
                                    uid: 'local-screen',
                                    isLocalScreen: true,
                                    user: user,
                                    name: `${user?.name} ${user?.surname} (Sizin Ekranınız)`
                                });
                            }

                            remoteUsers.forEach(u => {
                                const isRemoteScreenShare = u.uid > 1000000;
                                // Kendi ekran paylaşım botumuzu remote olarak gösterme
                                if (u.uid === Number(user?.id) + 1000000) return;
                                // EKRAN PAYLAŞIMI BOTU GİRDİĞİNDE VİDEO YOKSA GÖSTERME
                                if (isRemoteScreenShare && !u.hasVideo) return;
                                
                                let originalUid = isRemoteScreenShare ? u.uid - 1000000 : u.uid;
                                let baseName = remoteUserNames[originalUid];
                                if (!baseName) {
                                    baseName = (partnerInfo && originalUid === partnerInfo.id) ? `${partnerInfo.name} ${partnerInfo.surname || ''}`.trim() : 'Katılımcı';
                                }
                                if (isRemoteScreenShare) {
                                    baseName += ' - Ekranı';
                                }
                                const profilePicture = isRemoteScreenShare ? null : (remoteUserProfiles[originalUid]?.profilePicture || remoteUserProfiles[originalUid]?.picture || ((partnerInfo && originalUid === partnerInfo.id) ? partnerInfo?.profilePicture : null));
                                allParticipants.push({ uid: u.uid, isLocal: false, user: u, isRemoteScreenShare, name: baseName, profilePicture });
                            });

                            const activeRemoteScreenShare = allParticipants.find(p => p.isRemoteScreenShare);
                            const mainParticipantId = pinnedParticipant || (isScreenSharing ? 'local-screen' : (activeRemoteScreenShare ? activeRemoteScreenShare.uid : null));
                            const isSpotlightLayout = mainParticipantId !== null;
                            const mainParticipant = isSpotlightLayout ? allParticipants.find(p => p.uid === mainParticipantId) : null;
                            const actualSpotlight = isSpotlightLayout && mainParticipant;
                            
                            const sidebarParticipants = actualSpotlight ? allParticipants.filter(p => p.uid !== mainParticipant.uid) : [];
                            const gridParticipants = actualSpotlight ? [] : allParticipants;

                            const renderParticipantBox = (p, isMain, isGrid = false) => {
                                const isSpeaking = p.isLocal 
                                    ? activeSpeakers.some(id => String(id) === '0' || String(id) === String(user?.id))
                                    : activeSpeakers.some(id => String(id) === String(p.isRemoteScreenShare ? p.uid - 1000000 : p.uid));
                                
                                const hasAudio = p.isLocalScreen ? false : (p.isLocal ? !isMuted : (p.user?.hasAudio ?? false));

                                if (p.isLocalScreen) {
                                    return (
                                        <div key="local-screen" id="local-screen-video" style={{ 
                                            flex: isMain ? (isMobile ? 'none' : '3') : undefined,
                                            flexShrink: !isMain ? 0 : undefined,
                                            width: (isMain || isGrid) ? '100%' : (isMobile ? '160px' : '100%'),
                                            height: (isMain || isGrid) && !isMobile ? 'auto' : 'auto',
                                            aspectRatio: '16/9',
                                            maxHeight: isMobile && !isMain && !isGrid ? '100%' : ((isMain || isGrid) && isMobile ? '40vh' : '100%'),
                                            background: 'var(--color-bg-tertiary)', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: isSpeaking ? '3px solid #34a853' : '2px solid var(--color-border)', transition: 'border-color 0.2s'
                                        }}>
                                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#fff', zIndex: 10, fontWeight: '500', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span>{p.name}</span>
                                                <svg onClick={(e) => { e.stopPropagation(); togglePin('local-screen'); }} style={{ cursor: 'pointer', color: pinnedParticipant === 'local-screen' ? '#8b5cf6' : '#fff' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 4h4v4"/><path d="M14 10l6-6"/><path d="M8 20H4v-4"/><path d="M10 14l-6 6"/><path d="M16 20h4v-4"/><path d="M14 14l6 6"/><path d="M8 4H4v4"/><path d="M10 10L4 4"/>
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                } else if (p.isLocal) {
                                    return (
                                        <div key="local" id="local-video" style={{ 
                                            flex: isMain ? (isMobile ? 'none' : '3') : undefined,
                                            flexShrink: !isMain ? 0 : undefined,
                                            width: (isMain || isGrid) ? '100%' : (isMobile ? '160px' : '100%'),
                                            height: (isMain || isGrid) && !isMobile ? 'auto' : 'auto',
                                            aspectRatio: '16/9',
                                            maxHeight: isMobile && !isMain && !isGrid ? '100%' : ((isMain || isGrid) && isMobile ? '40vh' : '100%'),
                                            background: 'var(--color-bg-tertiary)', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: isSpeaking ? '3px solid #34a853' : '2px solid var(--color-border)', transition: 'border-color 0.2s'
                                        }}>
                                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px', borderRadius: '50%', display: 'flex', color: hasAudio ? (isSpeaking ? '#34a853' : '#fff') : '#ea4335', zIndex: 10 }}>
                                                {hasAudio ? <Mic size={16} /> : <MicOff size={16} />}
                                            </div>
                                            {(!videoTrackRef.current || isVideoOff) && (
                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                    {p.profilePicture ? (
                                                        <img src={p.profilePicture} style={{ width: isMobile && !isMain ? '50px' : '80px', height: isMobile && !isMain ? '50px' : '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)' }} alt="Profile" />
                                                    ) : (
                                                        <div style={{ width: isMobile && !isMain ? '50px' : '80px', height: isMobile && !isMain ? '50px' : '80px', borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile && !isMain ? '1.5rem' : '2rem', color: '#fff', border: '3px solid var(--color-border)' }}>
                                                            {user?.name?.charAt(0) || 'S'}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: isMobile && !isMain ? '0.8rem' : '1.2rem', color: 'var(--color-text-secondary)' }}>
                                                        {!videoTrackRef.current ? loadingStep : 'Kamera Kapalı'}
                                                    </div>
                                                    {!videoTrackRef.current && <div className="loading-spinner-small" style={{ margin: '0 auto' }}></div>}
                                                </div>
                                            )}
                                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#fff', zIndex: 10, fontWeight: '500', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span>{p.name}</span>
                                                <svg onClick={(e) => { e.stopPropagation(); togglePin('local'); }} style={{ cursor: 'pointer', color: pinnedParticipant === 'local' ? '#8b5cf6' : '#fff' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 4h4v4"/><path d="M14 10l6-6"/><path d="M8 20H4v-4"/><path d="M10 14l-6 6"/><path d="M16 20h4v-4"/><path d="M14 14l6 6"/><path d="M8 4H4v4"/><path d="M10 10L4 4"/>
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={p.uid} style={{ 
                                            flex: isMain ? (isMobile ? 'none' : '3') : undefined,
                                            flexShrink: !isMain ? 0 : undefined,
                                            width: (isMain || isGrid) ? '100%' : (isMobile ? '160px' : '100%'),
                                            height: (isMain || isGrid) && !isMobile ? 'auto' : 'auto',
                                            aspectRatio: '16/9',
                                            maxHeight: isMobile && !isMain && !isGrid ? '100%' : ((isMain || isGrid) && isMobile ? '40vh' : '100%'),
                                            background: 'var(--color-bg-tertiary)', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: isSpeaking ? '3px solid #34a853' : '2px solid var(--color-border)', transition: 'border-color 0.2s'
                                        }}>
                                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px', borderRadius: '50%', display: 'flex', color: hasAudio ? (isSpeaking ? '#34a853' : '#fff') : '#ea4335', zIndex: 10 }}>
                                                {hasAudio ? <Mic size={16} /> : <MicOff size={16} />}
                                            </div>
                                            <RemoteVideoPlayer 
                                                user={p.user} 
                                                partnerInfo={partnerInfo} 
                                                isMobile={isMobile} 
                                                fetchedName={p.isRemoteScreenShare ? '' : remoteUserNames[p.uid]} 
                                                isPinned={pinnedParticipant === p.uid}
                                                onPin={() => togglePin(p.uid)}
                                                forceName={p.name}
                                                profilePic={p.profilePicture}
                                            />
                                        </div>
                                    );
                                }
                            };

                            if (actualSpotlight) {
                                return (
                                    <>
                                        {renderParticipantBox(mainParticipant, true)}
                                        {sidebarParticipants.length > 0 && (
                                            <div style={{ 
                                                flex: isMobile ? 'none' : '1', 
                                                display: 'flex', 
                                                flexDirection: isMobile ? 'row' : 'column', 
                                                gap: '10px', 
                                                overflowY: isMobile ? 'hidden' : 'auto',
                                                overflowX: isMobile ? 'auto' : 'hidden',
                                                maxHeight: isMobile ? '120px' : '100%',
                                                minWidth: isMobile ? 'auto' : '200px'
                                            }}>
                                                {sidebarParticipants.map(p => renderParticipantBox(p, false))}
                                            </div>
                                        )}
                                    </>
                                );
                            } else {
                                return gridParticipants.map(p => renderParticipantBox(p, false, true));
                            }
                        })()}
                    </div>
                </div>
                <div style={{ position: 'absolute', bottom: isMobile ? '80px' : '100px', left: '20px', pointerEvents: 'none', zIndex: 1000, display: 'flex', flexDirection: 'column-reverse', gap: '5px' }}>
                    {meetingReactions.map(r => (
                        <div key={r.id} style={{ animation: 'floatUp 2.5s ease-out forwards', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>{r.emoji}</span>
                            <span style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', color: '#fff', fontWeight: '500' }}>
                                {r.senderId === user?.id?.toString() ? 'Siz' : (remoteUserNames[r.senderId] || 'Katılımcı')}
                            </span>
                        </div>
                    ))}
                    <style>{`
                        @keyframes floatUp {
                            0% { transform: translateY(0) scale(0.8); opacity: 0; }
                            15% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                            85% { transform: translateY(-100px) scale(1); opacity: 1; }
                            100% { transform: translateY(-120px) scale(0.8); opacity: 0; }
                        }
                    `}</style>
                </div>
                {isChatOpen && (
                    <div style={{ 
                        width: isMobile ? 'calc(100% - 20px)' : '350px', 
                        height: isMobile ? 'calc(100% - 20px)' : 'auto',
                        position: isMobile ? 'absolute' : 'relative',
                        top: isMobile ? '10px' : 'auto',
                        left: isMobile ? '10px' : 'auto',
                        zIndex: isMobile ? 100 : 1,
                        background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', 
                        margin: isMobile ? '0' : '15px', 
                        borderRadius: '16px', display: 'flex', flexDirection: 'column', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
                        overflow: 'hidden' 
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Sohbet</h3>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsChatOpen(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(isInBreakout ? breakoutMessages : mainMessages).length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>Henüz mesaj yok.</div>
                            ) : (
                                (isInBreakout ? breakoutMessages : mainMessages).map((msg, i) => {
                                    let senderName = msg.sender === 'Me' ? 'Siz' : (remoteUserNames[msg.publisherId] || ((partnerInfo && String(msg.publisherId) === String(partnerInfo.id)) ? partnerInfo?.name : 'Katılımcı'));
                                    return (
                                        <div key={i} style={{ 
                                            alignSelf: msg.sender === 'Me' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            background: msg.sender === 'Me' ? '#1a73e8' : 'var(--color-bg-tertiary)',
                                            color: msg.sender === 'Me' ? '#fff' : 'var(--color-text-primary)',
                                            fontSize: '0.9rem',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', color: msg.sender === 'Me' ? '#e8f0fe' : 'var(--color-text-secondary)' }}>
                                                {senderName}
                                            </div>
                                            <div>{msg.text}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>{msg.time}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div style={{ padding: '15px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px', background: 'var(--color-bg-primary)' }}>
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Mesaj yazın..."
                                style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                            />
                            <button 
                                onClick={sendMessage}
                                style={{ background: 'var(--color-accent-primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ 
                height: isMobile ? 'auto' : '85px',
                minHeight: isMobile ? '110px' : '85px', 
                background: 'var(--color-bg-secondary)', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'center' : 'space-between', 
                alignItems: 'center', 
                padding: isMobile ? '15px 15px 25px 15px' : '0 30px', 
                gap: isMobile ? '15px' : '0',
                borderTop: '1px solid var(--color-border)' 
            }}>
                <div style={{ width: isMobile ? '100%' : '30%', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '10px' }}>
                    {LIMIT !== Infinity && (
                        <>
                            <Clock size={isMobile ? 14 : 18} />
                            <span style={{ color: !user?.isPremium && (LIMIT - elapsedTime) < 60000 ? '#ea4335' : 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                                {formatRemainingTime(elapsedTime)}
                                {!intervalStart && <span style={{ marginLeft: '8px', color: 'var(--color-warning, #d97706)', fontSize: '0.8rem', fontStyle: 'italic' }}>(Bekleniyor...)</span>}
                            </span>
                        </>
                    )}
                    {!isMobile && <span style={{ fontSize: '0.8rem', opacity: 0.8, color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>| BONDLE MEET</span>}
                </div>
                <div style={{ display: 'flex', gap: isMobile ? '6px' : '15px', flexWrap: isMobile ? 'wrap' : 'nowrap', justifyContent: 'center', width: isMobile ? '100%' : 'auto', overflow: 'visible' }}>
                    {isHost && !isInBreakout && (
                        <div style={{ position: 'relative' }}>
                            <button disabled={loading} onClick={() => setShowBreakoutModal(!showBreakoutModal)} style={{ padding: isMobile ? '10px' : '14px', borderRadius: '50%', background: '#ff9800', border: 'none', cursor: 'pointer', color: '#fff' }} title="Odalara Dağıt">
                                <Users size={22} />
                            </button>
                            {showBreakoutModal && (
                                <div style={{ position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-bg-tertiary)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', width: '280px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)', zIndex: 1001, maxHeight: '60vh', overflowY: 'auto' }}>
                                    <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '4px' }}>Odalara Dağıt</div>
                                    
                                    <div style={{ display: 'flex', gap: '10px', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '8px' }}>
                                        <button onClick={() => setBreakoutMode('auto')} style={{ flex: 1, padding: '6px', border: 'none', background: breakoutMode === 'auto' ? '#1a73e8' : 'transparent', color: breakoutMode === 'auto' ? '#fff' : 'var(--color-text-secondary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Otomatik</button>
                                        <button onClick={() => setBreakoutMode('manual')} style={{ flex: 1, padding: '6px', border: 'none', background: breakoutMode === 'manual' ? '#1a73e8' : 'transparent', color: breakoutMode === 'manual' ? '#fff' : 'var(--color-text-secondary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Manuel</button>
                                    </div>

                                    <div style={{ marginTop: '10px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>Süre (Dakika) - 0 = Süresiz</div>
                                        <input type="number" min="0" max="120" value={breakoutDuration} onChange={(e) => setBreakoutDuration(Math.max(0, Number(e.target.value)))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' }} />
                                    </div>

                                    {breakoutMode === 'auto' ? (
                                        <>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '10px' }}>Her odada kaç kişi olsun?</div>
                                            <select value={breakoutSize} onChange={(e) => setBreakoutSize(Number(e.target.value))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', width: '100%' }}>
                                                <option value={2}>2 Kişi</option>
                                                <option value={3}>3 Kişi</option>
                                                <option value={4}>4 Kişi</option>
                                                <option value={5}>5 Kişi</option>
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '10px' }}>Oluşturulacak Oda Sayısı:</div>
                                            <input type="number" min="2" max="20" value={manualRoomCount} onChange={(e) => setManualRoomCount(Math.max(2, Number(e.target.value)))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' }} />
                                            
                                            <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Kişileri Odalara Ata:</div>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '8px', borderRadius: '6px' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Siz ({user?.name})</span>
                                                    <select value={manualAssignments[user?.id] || 1} onChange={(e) => setManualAssignments({ ...manualAssignments, [user?.id]: Number(e.target.value) })} style={{ padding: '4px', borderRadius: '4px', background: '#333', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                                                        {Array.from({length: manualRoomCount}).map((_, i) => (
                                                            <option key={i+1} value={i+1}>Oda {i+1}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                {remoteUsers.filter(ru => Number(ru.uid) < 1000000).map(ru => (
                                                    <div key={ru.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '8px', borderRadius: '6px' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{remoteUserNames[ru.uid] || `Katılımcı ${ru.uid}`}</span>
                                                        <select value={manualAssignments[ru.uid] || 1} onChange={(e) => setManualAssignments({ ...manualAssignments, [ru.uid]: Number(e.target.value) })} style={{ padding: '4px', borderRadius: '4px', background: '#333', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                                                            {Array.from({length: manualRoomCount}).map((_, i) => (
                                                                <option key={i+1} value={i+1}>Oda {i+1}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    
                                    <button onClick={handleStartBreakout} style={{ padding: '10px', background: 'var(--color-accent-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                                        Dağıt
                                    </button>
                                    <button onClick={handleEndBreakout} style={{ padding: '10px', background: '#ea4335', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>
                                        Eğer gelen olmadıysa herkesi tekrar çağır
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {isHost && isInBreakout && (
                        <button disabled={loading} onClick={handleEndBreakout} style={{ padding: isMobile ? '10px 20px' : '14px', borderRadius: '30px', background: '#ea4335', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }} title="Odalara Dağıt">
                            Topla
                        </button>
                    )}

                    <button disabled={loading} onClick={toggleMic} style={{ opacity: loading ? 0.5 : 1, padding: isMobile ? '10px' : '14px', borderRadius: '50%', background: isMuted ? '#ea4335' : 'var(--color-bg-tertiary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: isMuted ? '#fff' : 'var(--color-text-primary)' }}>{isMuted ? <MicOff size={22} /> : <Mic size={22} />}</button>
                    <button disabled={loading} onClick={toggleVideo} style={{ opacity: loading ? 0.5 : 1, padding: isMobile ? '10px' : '14px', borderRadius: '50%', background: isVideoOff ? '#ea4335' : 'var(--color-bg-tertiary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: isVideoOff ? '#fff' : 'var(--color-text-primary)' }}>{isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}</button>
                    {!isMobile && (
                        <button disabled={loading} onClick={toggleScreenShare} style={{ opacity: loading ? 0.5 : 1, padding: '14px', borderRadius: '50%', background: isScreenSharing ? '#8b5cf6' : 'var(--color-bg-tertiary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: isScreenSharing ? '#fff' : 'var(--color-text-primary)' }} title={isScreenSharing ? "Ekran Paylaşımını Durdur" : "Ekran Paylaş"}>
                            <Monitor size={22} />
                        </button>
                    )}
                    <div style={{ position: 'relative' }}>
                        <button disabled={loading} onClick={() => setShowVbMenu(!showVbMenu)} style={{ opacity: loading ? 0.5 : 1, padding: isMobile ? '10px' : '14px', borderRadius: '50%', background: vbType !== 'none' ? '#8ab4f8' : 'var(--color-bg-tertiary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: vbType !== 'none' ? '#202124' : 'var(--color-text-primary)' }} title="Arka Plan">
                            <Sparkles size={22} />
                        </button>
                        {showVbMenu && (
                            <div style={{ position: isMobile ? 'fixed' : 'absolute', bottom: isMobile ? '100px' : '70px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-bg-tertiary)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', width: '200px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)', zIndex: 1001 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '5px', borderBottom: '1px solid var(--color-border)', marginBottom: '5px' }}>Görsel Efektler</div>
                                
                                {vbLoading ? (
                                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-accent-primary)' }}>
                                        <div className="loading-spinner-small" style={{ margin: '0 auto 10px' }}></div>
                                        Efektler hazırlanıyor...
                                    </div>
                                ) : !vbProcessor ? (
                                    <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', color: '#ea4335' }}>
                                        Efektler bu tarayıcıda desteklenmiyor.
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => { handleVbChange('none'); setShowVbMenu(false); }} style={{ padding: '8px', background: vbType === 'none' ? 'var(--color-subtle-border)' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', boxSizing: 'border-box', gap: '10px' }}>
                                            <X size={16} /> Yok
                                        </button>
                                        <button onClick={() => { handleVbChange('blur'); setShowVbMenu(false); }} style={{ padding: '8px', background: vbType === 'blur' ? 'var(--color-subtle-border)' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', boxSizing: 'border-box', gap: '10px' }}>
                                            <Sparkles size={16} /> Bulanıklaştır
                                        </button>
                                        <button onClick={() => { 
                                            const img = new Image(); 
                                            img.crossOrigin = 'anonymous';
                                            img.onload = () => handleVbChange('image', { source: img });
                                            img.onerror = () => alert('Arka plan yüklenemedi.');
                                            img.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1280&auto=format&fit=crop';
                                            setShowVbMenu(false);
                                        }} style={{ padding: '8px', background: vbType === 'image' ? 'var(--color-subtle-border)' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', boxSizing: 'border-box', gap: '10px' }}>
                                            <ImageIcon size={16} /> Hazır Arka Plan
                                        </button>
                                        <label style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', boxSizing: 'border-box', gap: '10px' }}>
                                            <ImageIcon size={16} /> Görsel Yükle
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleFileUpload(e); setShowVbMenu(false); }} />
                                        </label>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button disabled={loading} onClick={() => setShowEmojiMenu(!showEmojiMenu)} style={{ padding: isMobile ? '10px' : '14px', borderRadius: '50%', background: showEmojiMenu ? '#8ab4f8' : 'var(--color-bg-tertiary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: showEmojiMenu ? '#202124' : 'var(--color-text-primary)' }} title="Tepki Gönder">
                            <Smile size={22} />
                        </button>
                        {showEmojiMenu && (
                            <div style={{ position: isMobile ? 'fixed' : 'absolute', bottom: isMobile ? '100px' : '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: isMobile ? '0' : '10px', background: 'var(--color-bg-tertiary)', padding: '10px', borderRadius: '12px', display: 'flex', gap: '5px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)', zIndex: 1002 }}>
                                {['👍', '👏', '❤️', '😂', '😮', '🎉'].map(emoji => (
                                    <button key={emoji} onClick={() => handleSendEmoji(emoji)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '5px', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsChatOpen(!isChatOpen)} style={{ position: 'relative', padding: isMobile ? '10px' : '14px', borderRadius: '50%', background: isChatOpen ? '#8ab4f8' : 'var(--color-bg-tertiary)', border: 'none', cursor: 'pointer', color: isChatOpen ? '#202124' : 'var(--color-text-primary)' }}>
                        <MessageSquare size={22} />
                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ea4335', color: '#fff', fontSize: '0.7rem', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <button onClick={handleLeaveMeeting} style={{ padding: isMobile ? '10px 20px' : '14px 28px', borderRadius: '30px', background: '#ea4335', border: 'none', cursor: 'pointer', color: '#fff' }}><PhoneOff size={22} /></button>
                </div>
                <div style={{ width: '30%', display: isMobile ? 'none' : 'flex', justifyContent: 'flex-end' }}>
                </div>
            </div>
        </div>
    );
};

const RemoteVideoPlayer = ({ user, partnerInfo, isMobile, fetchedName, isPinned, onPin, forceName, profilePic }) => {
    const playerRef = useRef(null);
    useEffect(() => {
        const track = user.videoTrack;
        if (user.hasVideo && track && playerRef.current) {
            track.play(playerRef.current);
        }
        return () => {
            if (track) {
                try { track.stop(); } catch(e) {}
            }
        };
    }, [user.hasVideo, user.videoTrack]);

    useEffect(() => {
        const track = user.audioTrack;
        if (user.hasAudio && track) {
            try { 
                track.play(); 
                track.setVolume(100);
            } catch(e) { console.warn("Audio play error", e); }
        }
        return () => {
            if (track) {
                try { track.stop(); } catch(e) {}
            }
        };
    }, [user.hasAudio, user.audioTrack]);

    const displayName = forceName || fetchedName || 'Katılımcı';

    return (
        <div style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {!(user.hasVideo && user.videoTrack) && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    {profilePic ? (
                        <img src={profilePic} style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)' }} alt="Profile" />
                    ) : (
                        <div style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px', borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1.5rem' : '2rem', color: '#fff', border: '3px solid var(--color-border)' }}>
                            {displayName.charAt(0)}
                        </div>
                    )}
                    <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: 'var(--color-text-secondary)' }}>
                        {user.hasVideo ? 'Kamera Yükleniyor...' : 'Kamera Kapalı'}
                    </div>
                </div>
            )}
            <div ref={playerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, opacity: (user.hasVideo && user.videoTrack) ? 1 : 0 }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#fff', zIndex: 10, fontWeight: '500', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{displayName}</span>
                {onPin && (
                    <svg onClick={(e) => { e.stopPropagation(); onPin(); }} style={{ cursor: 'pointer', color: isPinned ? '#8b5cf6' : '#fff' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h4v4"/><path d="M14 10l6-6"/><path d="M8 20H4v-4"/><path d="M10 14l-6 6"/><path d="M16 20h4v-4"/><path d="M14 14l6 6"/><path d="M8 4H4v4"/><path d="M10 10L4 4"/>
                    </svg>
                )}
            </div>
        </div>
    );
};

export default MeetingRoomPage;
