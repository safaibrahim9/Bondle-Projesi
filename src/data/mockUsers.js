export const mockUsers = [
    {
        id: 1,
        name: 'Admin User',
        email: 'admin@universe.com',
        password: 'admin123', // In production, this would be hashed
        googleId: null,
        role: 'admin',
        bio: 'UniVerse Merkez Administrator',
        interests: ['Management', 'Events', 'Community'],
        city: 'İstanbul',
        isPremium: false,
        clubAffiliation: null,
        profileId: 'UV-ADM1-N001',
        onboardingComplete: true,
    },
    {
        id: 2,
        name: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
        password: 'user123',
        googleId: 'google-123',
        role: 'user',
        bio: 'Yazılım geliştirici, teknoloji tutkunu',
        interests: ['technology', 'ai', 'startups'],
        city: 'İstanbul',
        isPremium: false,
        clubAffiliation: 'Tech İstanbul',
        profileId: 'UV-7A2B-9C4D',
        onboardingComplete: true,
    },
    {
        id: 3,
        name: 'Zeynep Kara',
        email: 'zeynep@example.com',
        password: 'user123',
        googleId: null,
        role: 'premium_user',
        bio: 'UX Designer, mentorluk seven',
        interests: ['design', 'ux-ui', 'psychology'],
        city: 'Ankara',
        isPremium: true,
        clubAffiliation: null,
        profileId: 'UV-3K8L-2M9N',
        onboardingComplete: true,
    },
    {
        id: 4,
        name: 'Mehmet Demir',
        email: 'mehmet@example.com',
        password: 'club123',
        googleId: 'google-456',
        role: 'club_management',
        bio: 'Startup Hub Ankara Başkanı',
        interests: ['startups', 'networking', 'business'],
        city: 'Ankara',
        isPremium: false,
        clubAffiliation: 'Startup Hub Ankara',
        clubRole: 'Başkan',
        profileId: 'UV-5X1Y-4Z7W',
        onboardingComplete: true,
    },
    {
        id: 5,
        name: 'Ayşe Şahin',
        email: 'ayse@example.com',
        password: 'user123',
        googleId: null,
        role: 'user',
        bio: 'Pazarlama uzmanı, networking aşığı',
        interests: ['marketing', 'content-creation', 'sales'],
        city: 'İzmir',
        isPremium: false,
        clubAffiliation: null,
        profileId: 'UV-6P4Q-8R2S',
        onboardingComplete: true,
    },
    {
        id: 6,
        name: 'Can Öztürk',
        email: 'can@example.com',
        password: 'user123',
        googleId: null,
        role: 'premium_user',
        bio: 'Girişimci, yatırımcı',
        interests: ['investment', 'startups', 'business'],
        city: 'İstanbul',
        isPremium: true,
        clubAffiliation: 'Tech İstanbul',
        profileId: 'UV-9T3U-7V5W',
        onboardingComplete: true,
    },
    {
        id: 7,
        name: 'Elif Yıldız',
        email: 'elif@example.com',
        password: 'user123',
        googleId: null,
        role: 'user',
        bio: 'Psikoloji öğrencisi',
        interests: ['psychology', 'education', 'health-wellness'],
        city: 'İstanbul',
        isPremium: false,
        clubAffiliation: null,
        profileId: 'UV-1H6J-5K9L',
        onboardingComplete: true,
    },
    {
        id: 8,
        name: 'Burak Arslan',
        email: 'burak@example.com',
        password: 'user123',
        googleId: null,
        role: 'user',
        bio: 'Veri bilimci, makine öğrenmesi uzmanı',
        interests: ['data-science', 'ai', 'technology'],
        city: 'Ankara',
        isPremium: false,
        clubAffiliation: null,
        profileId: 'UV-2M8N-3P7Q',
        onboardingComplete: true,
    },
];

// Function to get user by email and password
export const authenticateUser = (email, password) => {
    return mockUsers.find(
        (user) => user.email === email && user.password === password
    );
};

// Function to get user by ID
export const getUserById = (id) => {
    return mockUsers.find((user) => user.id === id);
};

// Function to get users for networking (excluding current user and already matched)
export const getAvailableUsers = (currentUserId, excludeIds = []) => {
    return mockUsers.filter(
        (user) =>
            user.id !== currentUserId &&
            !excludeIds.includes(user.id) &&
            (user.role === 'user' || user.role === 'premium_user')
    );
};

// Function to get all users sorted by name
export const getAllUsersSorted = () => {
    return [...mockUsers].sort((a, b) => a.name.localeCompare(b.name));
};
