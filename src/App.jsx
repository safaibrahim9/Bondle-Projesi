import React, { Suspense, lazy } from 'react';
// Force Vercel update - 23:24 - 23:23
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NetworkingProvider } from './contexts/NetworkingContext';
import { EventProvider } from './contexts/EventContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/Navigation/ProtectedRoute';
import BottomNav from './components/Navigation/BottomNav';
import LoginPage from './pages/Auth/LoginPage';
import GoogleSignInPage from './pages/Auth/GoogleSignInPage';
import OnboardingPage from './pages/Auth/OnboardingPage';

const HomePage = lazy(() => import('./pages/Home/HomePage'));
const UpcomingActivitiesPage = lazy(() => import('./pages/Home/UpcomingActivitiesPage'));
const EventsPage = lazy(() => import('./pages/Events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/Events/EventDetailPage'));
const EventFeedbackPage = lazy(() => import('./pages/Events/EventFeedbackPage'));
const NetworkingPage = lazy(() => import('./pages/Networking/NetworkingPage'));
const MatchHistoryPage = lazy(() => import('./pages/Networking/MatchHistoryPage'));
const ConnectionsPage = lazy(() => import('./pages/Networking/ConnectionsPage'));
const ScheduleMeetingPage = lazy(() => import('./pages/Networking/ScheduleMeetingPage'));
const MeetingRoomPage = lazy(() => import('./pages/Networking/MeetingRoomPage'));
const ClubsPage = lazy(() => import('./pages/Clubs/ClubsPage'));
const CommunityPage = lazy(() => import('./pages/Community/CommunityPage'));
const ClubCreatePage = lazy(() => import('./pages/Clubs/ClubCreatePage'));
const ClubDetailPage = lazy(() => import('./pages/Clubs/ClubDetailPage'));
const ClubAnalyticsDashboard = lazy(() => import('./pages/Clubs/ClubAnalyticsDashboard'));

const MentorshipPage = lazy(() => import('./pages/Mentorship/MentorshipPage'));
const AdminMentorshipPage = lazy(() => import('./pages/Admin/AdminMentorshipPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const PremiumPage = lazy(() => import('./pages/Premium/PremiumPage'));
const AICoachPage = lazy(() => import('./pages/Premium/AICoachPage'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const EventManagementPage = lazy(() => import('./pages/Admin/EventManagementPage'));
const PaymentVerificationPage = lazy(() => import('./pages/Admin/PaymentVerificationPage'));
const UserManagementPage = lazy(() => import('./pages/Admin/UserManagementPage'));
const PendingClubsPage = lazy(() => import('./pages/Admin/PendingClubsPage'));
const ClubManagementPage = lazy(() => import('./pages/Admin/ClubManagementPage'));
const PremiumApprovalPage = lazy(() => import('./pages/Admin/PremiumApprovalPage'));
const CompetitionSubmissionsPage = lazy(() => import('./pages/Admin/CompetitionSubmissionsPage'));
const AdminDailyAnswersPage = lazy(() => import('./pages/Admin/AdminDailyAnswersPage'));
const AdminAmbassadorsPage = lazy(() => import('./pages/Admin/AdminAmbassadorsPage'));
const AdminCompetitionsPage = lazy(() => import('./pages/Admin/AdminCompetitionsPage'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const AdminApplicationsPage = lazy(() => import('./pages/Admin/AdminApplicationsPage'));
const AdminEventApplicationsPage = lazy(() => import('./pages/Admin/AdminEventApplicationsPage'));
const AdminEventApprovalsSummaryPage = lazy(() => import('./pages/Admin/AdminEventApprovalsSummaryPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/Admin/AdminAnnouncementsPage'));
const AdminFeedbackPage = lazy(() => import('./pages/Admin/AdminFeedbackPage'));
const AdminMeetingAssignmentPage = lazy(() => import('./pages/Admin/AdminMeetingAssignmentPage'));
const AdminTasksPage = lazy(() => import('./pages/Admin/AdminTasksPage'));
const MyTasksPage = lazy(() => import('./pages/Tasks/MyTasksPage'));
const AdminReportsPage = lazy(() => import('./pages/Admin/AdminReportsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/Admin/AdminAnalyticsPage'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard/LeaderboardPage'));
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage'));
import { useAnalytics } from './hooks/useAnalytics';
import PushNotificationPrompt from './components/PushNotificationPrompt';

const AdminRoute = ({ children }) => {
    return <ProtectedRoute allowedRoles={['admin']} allowBranchRep={true}>{children}</ProtectedRoute>;
};

const AnalyticsTracker = () => {
    useAnalytics(true);
    return null;
};

const GlobalReferralTracker = () => {
    const { search } = useLocation();
    
    React.useEffect(() => {
        const searchParams = new URLSearchParams(search);
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('bondle_referral', ref);
        }
    }, [search]);
    
    return null;
};

const ScrollToTop = () => {
    const { pathname } = useLocation();
    
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    
    return null;
};

function App() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <ThemeProvider>
                <Router>
                <AuthProvider>
                    <ScrollToTop />
                    <AnalyticsTracker />
                    <GlobalReferralTracker />
                    <NetworkingProvider>
                        <EventProvider>
                            <Suspense fallback={
                                <div className="flex-center" style={{ minHeight: '100vh' }}>
                                    <div className="spinner"></div>
                                </div>
                            }>
                                <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/auth" element={<LoginPage />} />
                                <Route path="/register" element={<LoginPage />} />
                                <Route path="/admin/competitions" element={<AdminRoute><AdminCompetitionsPage /></AdminRoute>} />
                                <Route path="/admin/competitions/:id/submissions" element={<AdminRoute><CompetitionSubmissionsPage /></AdminRoute>} />
                                <Route path="/admin/daily-answers" element={<AdminRoute><AdminDailyAnswersPage /></AdminRoute>} />
                                <Route path="/admin/ambassadors" element={<AdminRoute><AdminAmbassadorsPage /></AdminRoute>} />

                                {/* Protected Routes */}
                                <Route
                                    path="/onboarding"
                                    element={
                                        <ProtectedRoute>
                                            <OnboardingPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/"
                                    element={
                                        <AppLayout>
                                            <HomePage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/leaderboard"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <LeaderboardPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/projects"
                                    element={
                                        <AppLayout>
                                            <ProjectsPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/activities"
                                    element={
                                        <AppLayout>
                                            <UpcomingActivitiesPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/community"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <CommunityPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/events"
                                    element={
                                        <AppLayout>
                                            <EventsPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/events/:id"
                                    element={
                                        <AppLayout>
                                            <EventDetailPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/events/:id/feedback"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <EventFeedbackPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/network"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <NetworkingPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/network/history"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <MatchHistoryPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/network/connections"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <ConnectionsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/network/connections/:connectionId/schedule"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <ScheduleMeetingPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/network/users/:targetUserId/schedule"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <ScheduleMeetingPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/meeting/:meetingId"
                                    element={
                                        <ProtectedRoute>
                                            <MeetingRoomPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/clubs"
                                    element={
                                        <AppLayout>
                                            <ClubsPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/clubs/create"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <ClubCreatePage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/clubs/:id"
                                    element={
                                        <AppLayout>
                                            <ClubDetailPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/clubs/:id/analytics"
                                    element={
                                        <ProtectedRoute allowedRoles={['club_management', 'admin']}>
                                            <AppLayout>
                                                <ClubAnalyticsDashboard />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/mentorship"
                                    element={
                                        <AppLayout>
                                            <MentorshipPage />
                                        </AppLayout>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <ProfilePage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/premium"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <PremiumPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/premium/ai-coach"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <AICoachPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/notifications"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <NotificationsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Admin Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin', 'campus_ambassador']} allowBranchRep={true}>
                                            <AppLayout>
                                                <AdminDashboard />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/events"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']} allowBranchRep={true}>
                                            <AppLayout>
                                                <EventManagementPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/event-approvals"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminEventApprovalsSummaryPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/payments"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <PaymentVerificationPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/premium-approvals"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <PremiumApprovalPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/announcements"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminAnnouncementsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/feedback"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminFeedbackPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/users"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']} allowBranchRep={true}>
                                            <AppLayout>
                                                <UserManagementPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/tasks"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']} allowBranchRep={true}>
                                            <AppLayout>
                                                <AdminTasksPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/my-tasks"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin', 'user']}>
                                            <AppLayout>
                                                <MyTasksPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/reports"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminReportsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/analytics"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminAnalyticsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/pending-clubs"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <PendingClubsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/club-management"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <ClubManagementPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/premium-approval"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <PremiumApprovalPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/competitions"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminCompetitionsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/mentorship"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminMentorshipPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/competitions/:id/applications"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminApplicationsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/admin/events/:id/applications"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin', 'club_president', 'club_management']} allowBranchRep={true}>
                                            <AppLayout>
                                                <AdminEventApplicationsPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/admin/event-approvals"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminEventApprovalsSummaryPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/admin/premium-approvals"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <PremiumApprovalPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/admin/assign-meeting"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <AppLayout>
                                                <AdminMeetingAssignmentPage />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                            </Suspense>
                        </EventProvider>
                    </NetworkingProvider>
                </AuthProvider>
                </Router>
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}

import Sidebar from './components/Navigation/Sidebar';

// Layout wrapper with bottom nav and sidebar
const AppLayout = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Authenticated but onboarding incomplete - redirect to onboarding
    if (!loading && user && user.onboardingComplete === false && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
            <BottomNav />
            <PushNotificationPrompt />
        </div>
    );
};

export default App;
