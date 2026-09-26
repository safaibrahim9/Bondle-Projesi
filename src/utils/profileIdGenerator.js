/**
 * Generate a unique Profile ID for UniVerse users
 * Format: UV-XXXX-YYYY (e.g., UV-7A2B-9C4D)
 * 
 * This ID is visible ONLY to the user and used for:
 * - Networking search (finding users with same name via ID)
 * - Unique user identification
 */

/**
 * Generate a random alphanumeric segment
 * @param {number} length - Length of the segment
 * @returns {string} Random alphanumeric string
 */
const generateSegment = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate a unique Profile ID
 * @returns {string} Profile ID in format UV-XXXX-YYYY
 */
export const generateProfileId = () => {
    const segment1 = generateSegment(4);
    const segment2 = generateSegment(4);
    return `UV-${segment1}-${segment2}`;
};

/**
 * Validate Profile ID format
 * @param {string} profileId - Profile ID to validate
 * @returns {boolean} True if valid format
 */
export const isValidProfileId = (profileId) => {
    const pattern = /^UV-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(profileId);
};

/**
 * Check if Profile ID is unique (mock implementation)
 * In production, this would query the backend
 * @param {string} profileId - Profile ID to check
 * @param {Array} existingUsers - Array of existing users
 * @returns {boolean} True if unique
 */
export const isProfileIdUnique = (profileId, existingUsers = []) => {
    return !existingUsers.some(user => user.profileId === profileId);
};

/**
 * Generate a guaranteed unique Profile ID
 * @param {Array} existingUsers - Array of existing users
 * @returns {string} Unique Profile ID
 */
export const generateUniqueProfileId = (existingUsers = []) => {
    let profileId;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        profileId = generateProfileId();
        attempts++;
        
        if (attempts >= maxAttempts) {
            // Add timestamp to ensure uniqueness if random generation fails
            profileId = `UV-${Date.now().toString(36).toUpperCase().slice(-4)}-${generateSegment(4)}`;
            break;
        }
    } while (!isProfileIdUnique(profileId, existingUsers));

    return profileId;
};
