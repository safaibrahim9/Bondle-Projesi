import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const EventContext = createContext(null);

export const useEvents = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvents must be used within EventProvider');
    }
    return context;
};

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');

    useEffect(() => {
        loadEvents();
        
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserRegistrations();
        }
    }, [selectedCity]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const eventsData = await api.getEvents(selectedCity);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to load events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRegistrations = async () => {
        try {
            console.log('Fetching user registrations...');
            const registrations = await api.getUserRegistrations();
            console.log('Raw registrations:', registrations);

            if (!Array.isArray(registrations)) {
                console.warn('Registrations response is not an array:', registrations);
                return [];
            }

            // Map registrations to get the event details flattened
            // IMPORTANT: Store registration status separately as 'registrationStatus'
            // to avoid overwriting the event's own 'status' field (e.g. 'approved')
            const formattedEvents = registrations
                .filter(reg => reg && reg.event) // Ensure event exists
                .map(reg => ({
                    ...reg.event,
                    eventId: reg.eventId,
                    registrationId: reg.id,
                    paymentStatus: reg.paymentStatus,
                    registrationStatus: reg.status, // 'PENDING', 'APPROVED', 'REJECTED'
                }));

            console.log('Formatted registered events:', formattedEvents);
            setRegisteredEvents(formattedEvents);
            return formattedEvents;
        } catch (error) {
            console.error('Failed to load user events:', error);
            return [];
        }
    };

    const registerForEvent = async (eventId, registrationData) => {
        try {
            const data = await api.registerForEvent(eventId, registrationData);
            await loadEvents();
            await fetchUserRegistrations(); // Refresh registrations immediately
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const adminAddParticipant = async (eventId, email) => {
        try {
            const data = await api.adminAddEventParticipant(eventId, email);
            await loadEvents();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const unregisterFromEvent = async (eventId) => {
        try {
            await api.unregisterFromEvent(eventId);
            await loadEvents();
            await fetchUserRegistrations();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const filterByCity = (city) => {
        setSelectedCity(city);
    };

    const getUserRegisteredEvents = async () => {
        // Return current state if available, or fetch
        if (registeredEvents.length > 0) return registeredEvents;
        return await fetchUserRegistrations();
    };

    const needsFeedback = () => {
        return [];
    };

    const submitFeedback = async (eventId, feedbackData) => {
        try {
            await api.submitEventFeedback(eventId, feedbackData.rating, feedbackData.comment);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        events,
        registeredEvents,
        loading,
        selectedCity,
        registerForEvent,
        unregisterFromEvent,
        filterByCity,
        refreshEvents: loadEvents,
        fetchUserRegistrations,
        getUserRegisteredEvents,
        needsFeedback,
        submitFeedback,
        adminAddParticipant,
    };

    return (
        <EventContext.Provider value={value}>
            {children}
        </EventContext.Provider>
    );
};
