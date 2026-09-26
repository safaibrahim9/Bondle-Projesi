import api from './api';

/**
 * Get all events
 * @returns {Promise<Array>} List of events
 */
export const getEvents = async () => {
    return api.request('/events');
};

export const getAllAdminEvents = async () => {
    return api.getAllAdminEvents();
};

/**
 * Get event by ID
 * @param {number} id - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEventById = async (id) => {
    return api.request(`/events/${id}`);
};

/**
 * Register for event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Registration result
 */
export const registerForEvent = async (eventId) => {
    return api.request(`/events/${eventId}/register`, {
        method: 'POST',
    });
};

/**
 * Get user's event registrations
 * @returns {Promise<Array>} List of registrations
 */
export const getUserRegistrations = async () => {
    return api.request('/events/my-registrations');
};

/**
 * Unregister from event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Unregister result
 */
export const unregisterFromEvent = async (eventId) => {
    return api.request(`/events/${eventId}/unregister`, {
        method: 'DELETE',
    });
};

/**
 * Create new event (Admin only)
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async (eventData) => {
    return api.request('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
    });
};

/**
 * Delete event (Admin only)
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Result
 */
export const deleteEvent = async (eventId) => {
    return api.request(`/events/${eventId}`, {
        method: 'DELETE',
    });
};

/**
 * Upload event image
 * @param {File} file - Image file
 * @returns {Promise<Object>} Upload result with url
 */
export const uploadEventImage = async (file) => {
    return api.uploadFile(file);
};

/**
 * Update event (Admin only)
 * @param {number} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (eventId, eventData) => {
    return api.request(`/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
    });
};

export default {
    getEvents,
    getAllAdminEvents,
    getEventById,
    registerForEvent,
    getUserRegistrations,
    unregisterFromEvent,
    createEvent,
    deleteEvent,
    uploadEventImage,
    updateEvent,
};
