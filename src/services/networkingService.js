import api from './api';

/**
 * Get suggested users for networking
 * @returns {Promise<Array>} List of suggested users
 */
export const getSuggestedUsers = async () => {
    // Return all available users for networking
    return api.getAvailableUsers();
};

/**
 * Create a networking match
 * @param {number} targetUserId - Target user ID
 * @returns {Promise<Object>} Match result
 */
export const createMatch = async (targetUserId) => {
    return api.request(`/networking/match/${targetUserId}`, {
        method: 'POST',
    });
};

/**
 * Get my networking matches
 * @returns {Promise<Array>} List of matches
 */
export const getMyMatches = async () => {
    return api.request('/networking/matches');
};

/**
 * Accept a match
 * @param {number} matchId - Match ID
 * @returns {Promise<Object>} Result
 */
export const acceptMatch = async (matchId) => {
    return api.request(`/networking/matches/${matchId}/accept`, {
        method: 'POST',
    });
};

/**
 * Reject a match
 * @param {number} matchId - Match ID
 * @returns {Promise<Object>} Result
 */
export const rejectMatch = async (matchId) => {
    return api.request(`/networking/matches/${matchId}/reject`, {
        method: 'POST',
    });
};

/**
 * Get my connections
 * @returns {Promise<Array>} List of connections
 */
export const getMyConnections = async () => {
    return api.request('/networking/connections');
};

/**
 * Schedule a meeting
 * @param {Object} meetingData - Meeting details
 * @returns {Promise<Object>} Scheduled meeting
 */
export const scheduleMeeting = async (meetingData) => {
    return api.request('/networking/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData),
    });
};

/**
 * Schedule a direct meeting with any user (no connection required)
 * @param {Object} meetingData - Direct meeting details
 * @returns {Promise<Object>} Scheduled meeting
 */
export const scheduleMeetingDirect = async (meetingData) => {
    return api.request('/networking/meetings/direct', {
        method: 'POST',
        body: JSON.stringify(meetingData),
    });
};

/**
 * Get my meetings
 * @returns {Promise<Array>} List of meetings
 */
export const getMyMeetings = async () => {
    return api.request('/networking/meetings');
};

/**
 * Get meeting by ID
 * @param {number} meetingId - Meeting ID
 * @returns {Promise<Object>} Meeting details
 */
export const getMeetingById = async (meetingId) => {
    return api.request(`/networking/meetings/${meetingId}`);
};

/**
 * Delete a connection
 * @param {number} connectionId - Connection ID to delete
 * @returns {Promise<Object>} Result
 */
export const deleteConnection = async (connectionId) => {
    return api.request(`/networking/connections/${connectionId}`, {
        method: 'DELETE',
    });
};

/**
 * Accept a meeting
 * @param {number} meetingId - Meeting ID
 * @returns {Promise<Object>} Result
 */
export const acceptMeeting = async (meetingId) => {
    return api.request(`/networking/meetings/${meetingId}/accept`, {
        method: 'POST',
    });
};

/**
 * Reject a meeting
 * @param {number} meetingId - Meeting ID
 * @returns {Promise<Object>} Result
 */
export const rejectMeeting = async (meetingId) => {
    return api.request(`/networking/meetings/${meetingId}/reject`, {
        method: 'POST',
    });
};

/**
 * Cancel a meeting
 * @param {number} meetingId - Meeting ID
 * @returns {Promise<Object>} Result
 */
export const cancelMeeting = async (meetingId) => {
    return api.request(`/networking/meetings/${meetingId}/cancel`, {
        method: 'DELETE',
    });
};

export default {
    getSuggestedUsers,
    createMatch,
    getMyMatches,
    acceptMatch,
    rejectMatch,
    getMyConnections,
    scheduleMeeting,
    scheduleMeetingDirect,
    getMyMeetings,
    getMeetingById,
    deleteConnection,
    acceptMeeting,
    rejectMeeting,
    cancelMeeting,
};
