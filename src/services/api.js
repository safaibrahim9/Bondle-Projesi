import imageCompression from 'browser-image-compression';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
// Force the new API URL to prevent old Vercel env vars from breaking the app
const API_BASE = isLocal ? `http://${window.location.hostname}:3001/api` : 'https://api.bondlecommunity.com/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
        
        // Clean up zombie refresh tokens left by the previous bug
        if (!this.token && this.refreshToken) {
            this.refreshToken = null;
            localStorage.removeItem('refreshToken');
        }

        this.isRefreshing = false;
        this.refreshSubscribers = [];
    }

    setToken(token, refreshToken = undefined) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }

        if (refreshToken !== undefined) {
            this.refreshToken = refreshToken;
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            } else {
                localStorage.removeItem('refreshToken');
            }
        }
    }

    async request(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 60000); // 60s timeout for Render cold starts
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                signal: options.signal || controller.signal,
                ...options,
                keepalive: options.keepalive,
                headers: {
                    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                    ...(this.token && { Authorization: `Bearer ${this.token}` }),
                    ...options.headers,
                },
            });
            clearTimeout(timeoutId);

            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                console.error('Failed to parse JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
            }

            if (!response.ok) {
                // Token Refresh Logic
                if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
                    if (!this.isRefreshing) {
                        this.isRefreshing = true;
                        try {
                            const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refreshToken: this.refreshToken })
                            });
                            
                            if (refreshResponse.ok) {
                                const refreshData = await refreshResponse.json();
                                this.setToken(refreshData.access_token, refreshData.refresh_token);
                                
                                options.headers = { ...options.headers, Authorization: `Bearer ${refreshData.access_token}` };
                                
                                this.refreshSubscribers.forEach(sub => sub.resolve(refreshData.access_token));
                                this.refreshSubscribers = [];
                                
                                return this.request(endpoint, options);
                            } else {
                                this.setToken(null, null);
                                window.dispatchEvent(new CustomEvent('auth-expired'));
                                const err = new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
                                this.refreshSubscribers.forEach(sub => sub.reject(err));
                                this.refreshSubscribers = [];
                                throw err;
                            }
                        } catch (error) {
                            this.setToken(null, null);
                            window.dispatchEvent(new CustomEvent('auth-expired'));
                            if (this.refreshSubscribers && this.refreshSubscribers.length > 0) {
                                this.refreshSubscribers.forEach(sub => sub.reject(error));
                                this.refreshSubscribers = [];
                            }
                            throw error;
                        } finally {
                            this.isRefreshing = false;
                        }
                    } else {
                        return new Promise((resolve, reject) => {
                            this.refreshSubscribers.push({
                                resolve: (newToken) => {
                                    options.headers = { ...options.headers, Authorization: `Bearer ${newToken}` };
                                    resolve(this.request(endpoint, options));
                                },
                                reject: (err) => {
                                    reject(err);
                                }
                            });
                        });
                    }
                } else if (response.status === 401 && !endpoint.includes('/auth/')) {
                    if (this.token) {
                        this.setToken(null, null);
                        window.dispatchEvent(new CustomEvent('auth-expired'));
                        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
                    } else {
                        throw new Error('Yetkisiz erişim. Bu işlem için giriş yapmalısınız.');
                    }
                }

                // Handle NestJS error response format { success, error, message, statusCode }
                const errorMessage = data?.error || data?.message || (Array.isArray(data?.message) ? data.message.join(', ') : data?.message) || 'Request failed';
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('API Error: Request timed out', endpoint);
                throw new Error('İstek zaman aşımına uğradı. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
            }
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    }

    async post(endpoint, data, options = {}) {
        const body = data instanceof FormData ? data : JSON.stringify(data);
        return this.request(endpoint, { method: 'POST', body, ...options });
    }

    async put(endpoint, data, options = {}) {
        const body = data instanceof FormData ? data : JSON.stringify(data);
        return this.request(endpoint, { method: 'PUT', body, ...options });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }

    // Auth
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        // Don't set token here - user needs to verify email first
        if (data.access_token) {
            this.setToken(data.access_token, data.refresh_token);
        }
        return data;
    }

    async logUserActivity(page, duration) {
        return this.request('/analytics/log', {
            method: 'POST',
            body: JSON.stringify({ page, duration }),
            keepalive: true
        });
    }

    async logUserEvent(type, name, metadata = {}) {
        return this.request('/analytics/event', {
            method: 'POST',
            body: JSON.stringify({ type, name, metadata }),
        });
    }

    async getAdminAnalytics(period = 'all') {
        return this.request(`/analytics/admin/summary?period=${period}`);
    }

    async getUserAdminAnalytics(userId, period = 'all') {
        return this.request(`/analytics/admin/user/${userId}?period=${period}`);
    }

    async getPageAdminAnalytics(page, period = 'all') {
        return this.request(`/analytics/admin/page-users?page=${encodeURIComponent(page)}&period=${period}`);
    }

    async getDailyAdminAnalytics(date) {
        return this.request(`/analytics/admin/daily-users?date=${date}`);
    }

    async getAdminAIInsights(period = 'all') {
        return this.request(`/analytics/admin/insights?period=${period}`);
    }

    async getPublicUserProfile(userId) {
        return this.request(`/users/profile/${userId}`);
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.access_token) {
            this.setToken(data.access_token, data.refresh_token);
        }
        return data;
    }

    async googleAuth(accessToken, referralCode) {
        const data = await this.request('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ accessToken, referralCode }),
        });
        if (data.access_token) {
            this.setToken(data.access_token, data.refresh_token);
        }
        return data;
    }

    async verifyEmail(email, code) {
        const data = await this.request('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
        if (data.access_token) {
            this.setToken(data.access_token, data.refresh_token);
        }
        return data;
    }

    async verify2FA(email, code) {
        const data = await this.request('/auth/verify-2fa', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
        if (data.access_token) {
            this.setToken(data.access_token, data.refresh_token);
        }
        return data;
    }

    async resendVerification(email) {
        return this.request('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(email, code, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code, newPassword }),
        });
    }

    async completeOnboarding(onboardingData) {
        const data = await this.request('/auth/onboarding', {
            method: 'POST',
            body: JSON.stringify(onboardingData),
        });
        if (data.access_token) {
            this.setToken(data.access_token, data.refresh_token);
        }
        return data;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async changePassword(oldPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword }),
        });
    }

    async exportUserData() {
        return this.request('/users/me/export');
    }

    async getMyReferrals() {
        return this.request('/users/me/referrals');
    }

    // Events
    async getEvents(city) {
        return this.request(`/events${city ? `?city=${city}` : ''}`);
    }

    async getEvent(id) {
        return this.request(`/events/${id}`);
    }


    async registerForEvent(eventId, registrationData) {
        return this.request(`/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify(registrationData),
        });
    }

    async adminAddEventParticipant(eventId, email) {
        return this.request(`/events/${eventId}/admin/add-participant`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async reportEventPayment(eventId) {
        return this.request(`/events/${eventId}/report-payment`, {
            method: 'POST',
        });
    }

    async unregisterFromEvent(eventId) {
        return this.request(`/events/${eventId}/unregister`, {
            method: 'DELETE',
        });
    }

    async getPendingRegistrations() {
        return this.request('/events/registrations/pending');
    }

    async getEventRegistrations(eventId) {
        return this.request(`/events/${eventId}/registrations`);
    }

    // --- Event Chat (Messages) ---
    async getEventMessages(eventId) {
        return this.request(`/events/${eventId}/messages`);
    }

    async postEventMessage(eventId, content, replyToId = null, isPoll = false, pollOptions = null) {
        return this.request(`/events/${eventId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, replyToId, isPoll, pollOptions }),
        });
    }

    async editEventMessage(eventId, messageId, content) {
        return this.request(`/events/${eventId}/messages/${messageId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    }

    async deleteEventMessage(eventId, messageId) {
        return this.request(`/events/${eventId}/messages/${messageId}`, {
            method: 'DELETE',
        });
    }

    async voteEventPoll(eventId, messageId, optionIds) {
        return this.request(`/events/${eventId}/messages/${messageId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionIds }),
        });
    }

    async verifyRegistration(registrationId) {
        return this.request(`/events/registrations/${registrationId}/verify`, {
            method: 'POST',
        });
    }

    async rejectRegistration(registrationId) {
        return this.request(`/events/registrations/${registrationId}/reject`, {
            method: 'POST',
        });
    }

    async getUserRegistrations() {
        return this.request('/events/my-registrations');
    }

    async getUserEvents() {
        return this.request('/users/me/events');
    }

    // Admin
    async getAdminEvents() {
        return this.request('/admin/events/pending');
    }

    async getAllAdminEvents() {
        return this.request('/admin/events/all');
    }

    async approveEvent(id) {
        return this.request(`/admin/events/${id}/approve`, { method: 'POST' });
    }

    async rejectEvent(id) {
        return this.request(`/admin/events/${id}/reject`, { method: 'POST' });
    }

    // Admin Features
    async getAdminDashboardStats() {
        return this.request('/admin/stats');
    }

    async getAdminPendingPayments() {
        return this.request('/admin/payments/pending');
    }

    async verifyAdminPayment(id) {
        return this.request(`/admin/payments/${id}/verify`, { method: 'POST' });
    }

    async rejectAdminPayment(id) {
        return this.request(`/admin/payments/${id}/reject`, { method: 'POST' });
    }

    async getAdminUsers() {
        return this.request('/admin/users');
    }

    async banUser(id) {
        return this.request(`/admin/users/${id}/ban`, { method: 'POST' });
    }

    async unbanUser(id) {
        return this.request(`/admin/users/${id}/unban`, { method: 'POST' });
    }

    async deleteUser(id) {
        return this.request(`/admin/users/${id}`, { method: 'DELETE' });
    }

    async getAdminReports() {
        return this.request('/admin/reports/pending');
    }

    async resolveReport(id, adminNote) {
        return this.request(`/admin/reports/${id}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ adminNote }),
        });
    }

    async grantUserPremium(id) {
        return this.request(`/admin/users/${id}/grant-premium`, { method: 'POST' });
    }

    async revokeUserPremium(id) {
        return this.request(`/admin/users/${id}/revoke-premium`, { method: 'POST' });
    }

    async addUserCredits(id, amount, description) {
        return this.request(`/admin/users/${id}/add-credits`, {
            method: 'POST',
            body: JSON.stringify({ amount, description }),
        });
    }

    // Credits
    async getCredits() {
        return this.request('/credits');
    }

    async getCreditHistory() {
        return this.request('/credits/history');
    }

    // User Profile
    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    // Networking
    async createMatch(targetUserId) {
        return this.request(`/networking/match/${targetUserId}`, {
            method: 'POST',
        });
    }

    async acceptMatch(matchId) {
        return this.request(`/networking/matches/${matchId}/accept`, {
            method: 'POST',
        });
    }

    async rejectMatch(matchId) {
        return this.request(`/networking/matches/${matchId}/reject`, {
            method: 'POST',
        });
    }

    async getMyMatches() {
        return this.request('/networking/matches');
    }

    async getIncomingRequests() {
        return this.request('/networking/requests/incoming');
    }

    async getMyConnections() {
        return this.request('/networking/connections');
    }

    async scheduleMeeting(meetingData) {
        return this.request('/networking/meetings', {
            method: 'POST',
            body: JSON.stringify(meetingData),
        });
    }

    async scheduleMeetingDirect(meetingData) {
        return this.request('/networking/meetings/direct', {
            method: 'POST',
            body: JSON.stringify(meetingData),
        });
    }

    async acceptMeeting(meetingId) {
        return this.request(`/networking/meetings/${meetingId}/accept`, {
            method: 'POST',
        });
    }

    async rejectMeeting(meetingId) {
        return this.request(`/networking/meetings/${meetingId}/reject`, {
            method: 'POST',
        });
    }

    async getIncomingMeetings() {
        return this.request('/networking/meetings/pending/incoming');
    }

    async getOutgoingMeetings() {
        return this.request('/networking/meetings/pending/outgoing');
    }

    async getMeetings() {
        return this.request('/networking/meetings');
    }

    async cancelConnectionRequest(matchId) {
        return this.request(`/networking/matches/${matchId}/cancel`, {
            method: 'DELETE',
        });
    }

    async getMeetingById(meetingId) {
        return this.request(`/networking/meetings/${meetingId}`);
    }

    async getMeetingToken(meetingId) {
        const response = await this.request(`/networking/meetings/${meetingId}/token`);
        console.log('API Token Response:', response);
        return response;
    }

    async logMeetingEvent(meetingId, eventType) {
        return this.request(`/networking/meetings/${meetingId}/log-event`, {
            method: 'POST',
            body: JSON.stringify({ eventType }),
        });
    }

    async cancelMeeting(meetingId) {
        return this.request(`/networking/meetings/${meetingId}/cancel`, {
            method: 'DELETE',
        });
    }

    async rescheduleMeeting(meetingId, data) {
        return this.request(`/networking/meetings/${meetingId}/reschedule`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async completeMeeting(meetingId) {
        return this.request(`/networking/meetings/${meetingId}/complete`, {
            method: 'POST',
        });
    }

    // Feedback
    async submitEventFeedback(eventId, rating, comment) {
        return this.request('/feedback/event', {
            method: 'POST',
            body: JSON.stringify({ eventId, rating, comment }),
        });
    }

    async submitGeneralFeedback(rating, comment) {
        return this.request('/feedback/general', {
            method: 'POST',
            body: JSON.stringify({ rating, comment }),
        });
    }

    async getAllGeneralFeedback() {
        return this.request('/feedback/general/all');
    }

    // Upload
    async uploadFile(file) {
        let fileToUpload = file;
        
        try {
            if (file.type && file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 1, // Vercel is very strict, keep it under 1MB
                    maxWidthOrHeight: 1280,
                    useWebWorker: true,
                };
                fileToUpload = await imageCompression(file, options);
                console.log(`[Upload] Image compressed from ${file.size} to ${fileToUpload.size}`);
            }
        } catch (error) {
            console.warn('[Upload] Image compression failed:', error);
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        });

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            if (response.status === 413) {
                throw new Error('Yüklenen dosya çok büyük. Lütfen daha küçük bir dosya seçin.');
            }
            throw new Error(`Sunucu hatası (JSON ayrıştırılamadı): ${text.slice(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(data?.message || data?.error || 'Dosya yükleme başarısız');
        }
        return data; // returns { url, publicId }
    }

    // Users
    async getUserProfile(userId) {
        return this.request(`/users/profile/${userId}`);
    }

    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async getAvailableUsers(search) {
        const url = search ? `/networking/suggestions?search=${encodeURIComponent(search)}` : '/networking/suggestions';
        return this.request(url);
    }

    async getAiSuggestions() {
        return this.request('/networking/ai-suggestions');
    }

    async getAiEventRecommendations() {
        return this.request('/events/ai-recommendations');
    }

    async getSmartRecommendations() {
        return this.request('/engagement/smart-recommendations');
    }

    async getDailyGoals() {
        return this.request('/engagement/daily-goals');
    }

    async completeDailyGoal(key) {
        return this.request(`/engagement/daily-goals/${key}/complete`, {
            method: 'POST',
        });
    }

    // Community
    async getCommunityFeed(limit = 20, offset = 0) {
        return this.request(`/community/feed?limit=${limit}&offset=${offset}`);
    }

    async createCommunityPost(postData) {
        // postData can be FormData or a regular object
        const body = postData instanceof FormData ? postData : JSON.stringify(postData);
        return this.request('/community/posts', {
            method: 'POST',
            body,
        });
    }

    async updateCommunityPost(postId, content) {
        return this.request(`/community/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    }

    async deleteCommunityPost(id) {
        return this.request(`/community/posts/${id}`, {
            method: 'DELETE',
        });
    }

    async togglePostLike(postId) {
        return this.request(`/community/posts/${postId}/like`, { method: 'POST' });
    }

    async getPostLikes(postId) {
        return this.request(`/community/posts/${postId}/likes`);
    }

    async addPostComment(postId, content) {
        return this.request(`/community/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async getPostComments(postId) {
        return this.request(`/community/posts/${postId}/comments`);
    }

    async toggleCommentLike(commentId) {
        return this.request(`/community/comments/${commentId}/like`, { method: 'POST' });
    }

    // Clubs
    async getClubs(city) {
        return this.request(`/clubs${city ? `?city=${city}` : ''}`);
    }

    async getManagedClubs() {
        return this.request('/clubs/managed');
    }

    async getClub(id) {
        return this.request(`/clubs/${id}`);
    }

    async createClub(clubData) {
        return this.request('/clubs', {
            method: 'POST',
            body: JSON.stringify(clubData),
        });
    }

    async updateClub(clubId, clubData) {
        return this.request(`/clubs/${clubId}`, {
            method: 'PUT',
            body: JSON.stringify(clubData),
        });
    }

    async getClubOfficials(clubId) {
        return this.request(`/clubs/${clubId}/officials`);
    }

    async updateClubOfficials(clubId, officialUserIds) {
        return this.request(`/clubs/${clubId}/officials`, {
            method: 'PUT',
            body: JSON.stringify({ officialUserIds }),
        });
    }

    async uploadClubLogo(clubId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/clubs/${clubId}/upload-logo`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Logo upload failed');
        }
        return data;
    }

    async joinClub(clubId) {
        return this.request(`/clubs/${clubId}/join`, {
            method: 'POST',
        });
    }

    async leaveClub(clubId) {
        return this.request(`/clubs/${clubId}/leave`, {
            method: 'DELETE',
        });
    }

    // Premium
    async generateShopierPayment(plan) {
        return this.request(`/premium/generate-payment/${plan}`, {
            method: 'POST',
        });
    }

    async createPremiumRequest(data) {
        return this.request('/premium/request', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMyPremiumRequest() {
        return this.request('/premium/my-request');
    }

    async getPendingPremiumRequests() {
        return this.request('/premium/pending');
    }

    async approvePremiumRequest(requestId) {
        return this.request(`/premium/approve/${requestId}`, {
            method: 'POST',
        });
    }

    async rejectPremiumRequest(requestId, reason) {
        return this.request(`/premium/reject/${requestId}`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    // Competitions
    async getAllCompetitions() {
        return this.request('/competitions');
    }

    async createCompetition(competitionData) {
        return this.request('/competitions', {
            method: 'POST',
            body: JSON.stringify(competitionData),
        });
    }

    async updateCompetition(id, competitionData) {
        return this.request(`/competitions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(competitionData),
        });
    }

    async deleteCompetition(id) {
        return this.request(`/competitions/${id}`, {
            method: 'DELETE',
        });
    }

    async submitCompetition(competitionId, formData) {
        return this.request(`/competitions/${competitionId}/submit`, {
            method: 'POST',
            body: JSON.stringify(formData),
        });
    }

    async getMyCompetitionSubmissions() {
        return this.request('/competitions/my-submissions/all');
    }

    async getCompetitionSubmissions() {
        return this.request('/competitions/submissions/all');
    }

    async getCompetitionApplications(competitionId) {
        return this.request(`/competitions/${competitionId}/applications`);
    }

    async updateSubmissionStatus(submissionId, status) {
        return this.request(`/competitions/submissions/${submissionId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status }),
        });
    }

    async deleteSubmission(submissionId) {
        return this.request(`/competitions/submissions/${submissionId}`, {
            method: 'DELETE',
        });
    }

    // Notifications
    async getNotifications() {
        return this.request('/notifications');
    }

    async getUnreadNotificationCount() {
        return this.request('/notifications/unread-count');
    }

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, {
            method: 'POST',
        });
    }

    async markAllNotificationsRead() {
        return this.request('/notifications/read-all', {
            method: 'POST',
        });
    }

    // Mentorship
    async getMentors() {
        return this.request('/mentorship/mentors');
    }

    async requestMentorship(mentorId, notes) {
        return this.request(`/mentorship/request/${mentorId}`, {
            method: 'POST',
            body: JSON.stringify({ notes }),
        });
    }

    async getMyMentorships() {
        return this.request('/mentorship/my-mentorships');
    }

    async deleteClub(clubId) {
        return this.request(`/clubs/${clubId}`, {
            method: 'DELETE',
        });
    }


    // Engagement (Streak, Badges, Challenges)
    async recordDailyLogin() {
        return this.request('/engagement/daily-login', { method: 'POST' });
    }

    async getEngagementSummary() {
        return this.request('/engagement/summary');
    }

    async getStreak() {
        return this.request('/engagement/streak');
    }

    async getBadges() {
        return this.request('/engagement/badges');
    }

    async markBadgesSeen() {
        return this.request('/engagement/badges/seen', { method: 'POST' });
    }

    async getWeeklyChallenges() {
        return this.request('/engagement/challenges');
    }

    async getLeaderboard(limit = 100) {
        return this.request(`/engagement/leaderboard?limit=${limit}`);
    }

    async useReferralCode(code) {
        return this.request('/engagement/use-referral', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    async submitDailyAnswer(question, answer) {
        return this.request('/engagement/daily-answers', {
            method: 'POST',
            body: JSON.stringify({ question, answer }),
        });
    }

    async getDailyAnswers() {
        return this.request('/engagement/daily-answers');
    }

    async setDailyAnswerWinner(id, rank) {
        return this.request(`/engagement/daily-answers/${id}/winner`, {
            method: 'POST',
            body: JSON.stringify({ rank }),
        });
    }

    async getDailyWinners() {
        return this.request('/engagement/daily-answers/winners');
    }

    async announceDailyWinners() {
        return this.request('/engagement/daily-answers/announce', {
            method: 'POST'
        });
    }

    // Logout
    logout() {
        this.setToken(null, null);
    }

    async deleteAccount() {
        return this.request('/users/me', {
            method: 'DELETE',
        });
    }

    // AI Career Coach
    async aiAnalyzeCV(cvText) {
        return this.request('/ai/career/cv-analyze', {
            method: 'POST',
            body: JSON.stringify({ cvText }),
        });
    }

    async aiAnalyzeCVPdf(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.request('/ai/career/cv-analyze-pdf', {
            method: 'POST',
            body: formData,
        });
    }

    async aiStartInterview(position) {
        return this.request('/ai/career/interview-start', {
            method: 'POST',
            body: JSON.stringify({ position }),
        });
    }

    async aiAnswerInterview(position, question, answer) {
        return this.request('/ai/career/interview-answer', {
            method: 'POST',
            body: JSON.stringify({ position, question, answer }),
        });
    }

    async aiEndInterview(position, chatHistory) {
        return this.request('/ai/career/interview-end', {
            method: 'POST',
            body: JSON.stringify({ position, chatHistory }),
        });
    }

    async reportUser(reportedUserId, reason, details) {
        return this.request('/abuse/report', {
            method: 'POST',
            body: JSON.stringify({ reportedUserId, reason, details }),
        });
    }

    async blockUser(userId) {
        return this.request(`/abuse/block/${userId}`, {
            method: 'POST',
        });
    }

    async deleteUser(userId) {
        return this.request(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    }

    async updateUserRole(userId, role) {
        return this.request(`/admin/users/${userId}/role`, {
            method: 'POST',
            body: JSON.stringify({ role })
        });
    }

    async updateUserTeamBranch(userId, team, branch, isBranchRepresentative, canCreateEvents) {
        return this.request(`/admin/users/${userId}/team-branch`, {
            method: 'PATCH',
            body: JSON.stringify({ team, branch, isBranchRepresentative, canCreateEvents })
        });
    }

    async getAmbassadorReferrals(userId) {
        return this.request(`/admin/users/${userId}/referrals`);
    }

    // --- Tasks & Teams API ---
    async getAdminTasks() {
        return this.request('/tasks/admin');
    }

    async createAdminTask(taskData) {
        return this.request('/tasks/admin', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async deleteAdminTask(taskId) {
        return this.request(`/tasks/admin/${taskId}`, {
            method: 'DELETE'
        });
    }

    async updateAdminTask(taskId, updateData) {
        return this.request(`/tasks/admin/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
    }

    async getMyTasks() {
        return this.request('/tasks/my-tasks');
    }

    async completeTask(taskId, updateData) {
        return this.request(`/tasks/${taskId}/complete`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
    }

    async unblockUser(userId) {
        return this.request(`/abuse/block/${userId}`, {
            method: 'DELETE',
        });
    }

    async getMyBlocks() {
        return this.request('/abuse/blocks');
    }

    // Projects
    async getProjects(category, skill) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (skill) params.append('skill', skill);
        return this.request(`/projects?${params.toString()}`);
    }

    async getProject(id) {
        return this.request(`/projects/${id}`);
    }

    async createProject(data) {
        return this.request('/projects', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateProject(id, data) {
        return this.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteProject(id) {
        return this.request(`/projects/${id}`, { method: 'DELETE' });
    }

    async applyToProject(id, applicationData) {
        return this.request(`/projects/${id}/apply`, { method: 'POST', body: JSON.stringify(applicationData) });
    }

    async acceptProjectApplication(applicationId) {
        return this.request(`/projects/applications/${applicationId}/accept`, { method: 'POST' });
    }

    async rejectProjectApplication(applicationId) {
        return this.request(`/projects/applications/${applicationId}/reject`, { method: 'POST' });
    }

    async getMyProjects() {
        return this.request('/projects/my');
    }

    async getMyProjectApplications() {
        return this.request('/projects/my-applications');
    }

    async getBranchRepresentatives() {
        return this.request('/users/branch-representatives');
    }
}

export default new ApiClient();
