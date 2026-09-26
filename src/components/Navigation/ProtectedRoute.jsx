import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], allowBranchRep = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Not authenticated - redirect to Google Sign-In
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Authenticated but onboarding incomplete - redirect to onboarding
    // (unless already on onboarding page)
    if (user.onboardingComplete === false && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    // Authenticated and onboarding complete - prevent accessing onboarding page
    if (user.onboardingComplete === true && location.pathname === '/onboarding') {
        return <Navigate to="/" replace />;
    }

    // Role-based access control
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        if (allowBranchRep && user.isBranchRepresentative) {
            // allow access
        } else {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
