import api from './api';
import imageCompression from 'browser-image-compression';

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfile = async (userId, profileData) => {
    return api.updateProfile(profileData);
};

/**
 * Upload user avatar to Cloudinary
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Upload result with image URL
 */
export const uploadAvatar = async (file) => {
    let fileToUpload = file;
    
    try {
        if (file.type && file.type.startsWith('image/')) {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };
            fileToUpload = await imageCompression(file, options);
        }
    } catch (error) {
        console.warn('[Upload] Avatar compression failed:', error);
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const token = localStorage.getItem('token');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
    const API_BASE = isLocal ? `http://${window.location.hostname}:3001/api` : 'https://api.bondlecommunity.com/api';

    const response = await fetch(`${API_BASE}/users/upload-avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
            error = JSON.parse(errorText);
        } catch {
            if (response.status === 413) throw new Error('Resim çok büyük. Lütfen daha küçük bir resim seçin.');
            throw new Error('Upload failed');
        }
        throw new Error(error.message || 'Upload failed');
    }

    return response.json();
};

/**
 * Get recent profile views
 * @returns {Promise<Array>} List of profile views
 */
export const getMyProfileViews = async () => {
    return api.get('/users/me/profile-views');
};

export default {
    updateProfile,
    uploadAvatar,
    getMyProfileViews,
};
