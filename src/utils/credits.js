// Credit reset is weekly (every Monday at 00:00)
export const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
};

export const getCreditAllocation = (userRole) => {
    switch (userRole) {
        case 'premium_user':
            return 20; // Premium users get 20 credits per week
        case 'user':
        default:
            return 10; // Regular users get 10 credits per week
    }
};

export const shouldResetCredits = (lastResetTime) => {
    const currentWeekStart = getWeekStart();
    return !lastResetTime || lastResetTime < currentWeekStart;
};

export const calculateRemainingCredits = (user, usedCredits, lastResetTime) => {
    const allocation = getCreditAllocation(user.role);

    if (shouldResetCredits(lastResetTime)) {
        return allocation; // Fresh week, full credits
    }

    return Math.max(0, allocation - usedCredits);
};
