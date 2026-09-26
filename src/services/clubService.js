import api from './api';

/**
 * Get all clubs with optional city filter
 * @param {string} city - City filter ('all' or city name)
 * @returns {Promise<Array>} List of clubs
 */
export const getClubs = async (city = 'all') => {
    try {
        const query = city && city !== 'all' ? `?city=${encodeURIComponent(city)}` : '';
        const clubs = await api.request(`/clubs${query}`);
        // Fallback filter in case backend doesn't handle the query param
        if (city && city !== 'all') {
            return clubs.filter(c => c.city === city);
        }
        return clubs;
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return [];
    }
};

/**
 * Get club by ID
 * @param {number} id - Club ID
 * @returns {Promise<Object>} Club data
 */
export const getClubById = async (id) => {
    return api.request(`/clubs/${id}`);
};

/**
 * Create new club
 * @param {Object} clubData - Club data {name, description, city, categories}
 * @returns {Promise<Object>} Created club
 */
export const createClub = async (clubData) => {
    return api.request('/clubs', {
        method: 'POST',
        body: JSON.stringify(clubData),
    });
};

/**
 * Update club (president only)
 * @param {number} id - Club ID
 * @param {Object} clubData - Updated club data
 * @returns {Promise<Object>} Updated club
 */
export const updateClub = async (id, clubData) => {
    return api.request(`/clubs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clubData),
    });
};

/**
 * Upload club logo (president only)
 * @param {number} clubId - Club ID
 * @param {File} file - Logo file
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadClubLogo = async (clubId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.request(`/clubs/${clubId}/upload-logo`, {
        method: 'POST',
        body: formData,
    });
};

/**
 * Join club
 * @param {number} clubId - Club ID
 * @returns {Promise<Object>} Success message
 */
export const joinClub = async (clubId) => {
    return api.request(`/clubs/${clubId}/join`, {
        method: 'POST',
    });
};

/**
 * Leave club
 * @param {number} clubId - Club ID
 * @returns {Promise<Object>} Success message
 */
export const leaveClub = async (clubId) => {
    return api.request(`/clubs/${clubId}/leave`, {
        method: 'DELETE',
    });
};

/**
 * Get pending clubs (admin only)
 * @returns {Promise<Array>} List of pending clubs
 */
export const getPendingClubs = async () => {
    return api.request('/clubs/pending');
};

/**
 * Approve club (admin only)
 * @param {number} clubId - Club ID
 * @returns {Promise<Object>} Success message
 */
export const approveClub = async (clubId) => {
    return api.request(`/clubs/${clubId}/approve`, {
        method: 'PUT',
    });
};

/**
 * Reject club (admin only)
 * @param {number} clubId - Club ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Success message
 */
export const rejectClub = async (clubId, reason) => {
    return api.request(`/clubs/${clubId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
    });
};

export default {
    getClubs,
    getClubById,
    createClub,
    updateClub,
    uploadClubLogo,
    joinClub,
    leaveClub,
    getPendingClubs,
    approveClub,
    rejectClub,
};
