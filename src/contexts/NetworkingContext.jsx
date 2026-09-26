import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NetworkingContext = createContext(null);

export const useNetworking = () => {
    const context = useContext(NetworkingContext);
    if (!context) {
        throw new Error('useNetworking must be used within NetworkingProvider');
    }
    return context;
};

export const NetworkingProvider = ({ children }) => {
    const { user } = useAuth();
    const [credits, setCredits] = useState(0);
    const [creditHistory, setCreditHistory] = useState([]);
    const [matchHistory, setMatchHistory] = useState([]);
    const [connections, setConnections] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [incomingMeetings, setIncomingMeetings] = useState([]);
    const [outgoingMeetings, setOutgoingMeetings] = useState([]);

    // Load credits and networking data when user logs in
    useEffect(() => {
        if (user) {
            loadCredits();
            loadMatches();
            loadConnections();
            loadAvailableUsers();
            loadIncomingRequests();
            loadIncomingMeetings();
            loadOutgoingMeetings();
        }
    }, [user]);

    const loadCredits = useCallback(async () => {
        try {
            const data = await api.getCredits();
            setCredits(data.availableCredits || 0);
        } catch (error) {
            console.error('Failed to load credits:', error);
        }
    }, []);

    const loadIncomingRequests = useCallback(async () => {
        try {
            const requests = await api.getIncomingRequests();
            setIncomingRequests(requests || []);
        } catch (error) {
            console.error('Failed to load incoming requests:', error);
        }
    }, []);

    const loadIncomingMeetings = useCallback(async () => {
        try {
            const meetings = await api.getIncomingMeetings();
            setIncomingMeetings(meetings || []);
        } catch (error) {
            console.error('Failed to load incoming meetings:', error);
        }
    }, []);

    const loadOutgoingMeetings = useCallback(async () => {
        try {
            const meetings = await api.getOutgoingMeetings();
            setOutgoingMeetings(meetings || []);
        } catch (error) {
            console.error('Failed to load outgoing meetings:', error);
        }
    }, []);

    const loadCreditHistory = useCallback(async () => {
        try {
            const data = await api.getCreditHistory();
            setCreditHistory(data);
        } catch (error) {
            console.error('Failed to load credit history:', error);
        }
    }, []);

    const loadMatches = useCallback(async () => {
        try {
            const data = await api.getMyMatches();
            setMatchHistory(data);
        } catch (error) {
            console.error('Failed to load matches:', error);
        }
    }, []);

    const loadConnections = useCallback(async () => {
        try {
            const data = await api.getMyConnections();
            setConnections(data);
        } catch (error) {
            console.error('Failed to load connections:', error);
        }
    }, []);

    const loadAvailableUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getAvailableUsers();
            setAvailableUsers(data);
            if (data.length > 0) {
                // Cannot rely on currentMatch in useCallback directly without adding it to deps
                setCurrentMatch(prev => prev || data[0]);
            }
        } catch (error) {
            console.error('Failed to load available users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const sendConnectionRequest = async (targetUserId) => {
        try {
            await api.createMatch(targetUserId);
            await loadMatches(); // Reload matches to reflect pending status
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const acceptConnectionRequest = async (matchId) => {
        if (credits <= 0) {
            return { success: false, error: 'No credits available' };
        }

        try {
            setLoading(true);
            await api.acceptMatch(matchId);

            // Reload data
            await loadCredits();
            await loadMatches();
            await loadConnections();
            await loadIncomingRequests();

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const rejectConnectionRequest = async (matchId) => {
        try {
            setLoading(true);
            await api.rejectMatch(matchId);
            await loadIncomingRequests();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const cancelConnectionRequest = async (matchId) => {
        try {
            setLoading(true);
            await api.cancelConnectionRequest(matchId);

            // Reload matches to update UI - cancelled match will be removed
            await loadMatches();

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Kept for backward compatibility if needed, but primary flow is now request-based
    const acceptMatch = async (matchedUser) => {
        // ... (legacy logic if needed)
        return { success: false, error: "Use acceptConnectionRequest instead" };
    };

    const rejectMatch = (matchedUser) => {
        // ... (legacy logic if needed)
        nextMatch();
        return { success: true };
    };

    const nextMatch = () => {
        const currentIndex = availableUsers.findIndex((u) => u.id === currentMatch?.id);
        const nextIndex = currentIndex + 1;

        if (nextIndex < availableUsers.length) {
            setCurrentMatch(availableUsers[nextIndex]);
        } else {
            setCurrentMatch(null);
        }
    };

    const hasCredits = () => {
        return credits > 0;
    };

    const getMatchById = (userId) => {
        return matchHistory.find((m) => m.userId === userId);
    };

    const getUpcomingMeetings = useCallback(async () => {
        try {
            const meetings = await api.getMeetings();
            return meetings || [];
        } catch (error) {
            console.error('Failed to load meetings:', error);
            return [];
        }
    }, []);

    const scheduleMeeting = async (connectionId, meetingData) => {
        try {
            setLoading(true);
            await api.scheduleMeeting({
                connectionId,
                scheduledDate: new Date(meetingData.dateTime),
                location: meetingData.location,
                isOnline: meetingData.locationType === 'online',
                zoomLink: meetingData.locationType === 'online' ? 'To be generated' : null,
                notes: meetingData.notes,
            });

            // Reload credits (1 credit was deducted)
            await loadCredits();

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const cancelMeetingReq = async (meetingId) => {
        try {
            setLoading(true);
            await api.cancelMeeting(meetingId);
            return { success: true };
        } catch (error) {
            console.error('Failed to cancel meeting:', error);
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const rescheduleMeetingReq = async (meetingId, meetingData) => {
        try {
            setLoading(true);
            await api.rescheduleMeeting(meetingId, {
                scheduledDate: new Date(meetingData.dateTime),
                notes: meetingData.notes
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to reschedule meeting:', error);
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const refreshNetworkingData = useCallback(() => {
        loadCredits();
        loadMatches();
        loadConnections();
        loadAvailableUsers();
        loadIncomingRequests();
        loadIncomingMeetings();
        loadOutgoingMeetings();
    }, [loadCredits, loadMatches, loadConnections, loadAvailableUsers, loadIncomingRequests, loadIncomingMeetings, loadOutgoingMeetings]);

    const value = {
        credits,
        creditHistory,
        matchHistory,
        connections,
        currentMatch,
        availableMatches: availableUsers,
        incomingRequests,
        incomingMeetings,
        outgoingMeetings,
        loading,
        acceptMatch,
        rejectMatch,
        sendConnectionRequest,
        acceptConnectionRequest,
        rejectConnectionRequest,
        cancelConnectionRequest,
        nextMatch,
        hasCredits,
        getMatchById,
        loadCreditHistory,
        refreshCredits: loadCredits,
        getUpcomingMeetings,
        scheduleMeeting,
        cancelMeetingReq,
        rescheduleMeetingReq,
        refreshNetworkingData,
        loadIncomingMeetings,
        loadOutgoingMeetings,
    };

    return <NetworkingContext.Provider value={value}>{children}</NetworkingContext.Provider>;
};
