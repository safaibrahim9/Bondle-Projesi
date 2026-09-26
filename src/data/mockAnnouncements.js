export const mockAnnouncements = [
    {
        id: 3,
        title: '🌟 Premium Üye Avantajları',
        description: 'Sınırsız networking ve özel etkinliklere erişim',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600',
        date: '2026-01-20',
        type: 'promotion',
        linkTo: '/premium',
        clubId: null, // System announcement
    },
    {
        id: 5,
        title: '🚀 Yeni Kulüpler Platformda',
        description: 'İlgi alanlarına göre kulüpleri keşfet',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600',
        date: '2026-01-18',
        type: 'feature',
        linkTo: '/clubs',
        clubId: null,
    },
];

// Helper functions
export const getActiveAnnouncements = () => {
    const now = new Date();
    return mockAnnouncements
        .filter(announcement => {
            const announcementDate = new Date(announcement.date);
            const daysDiff = (now - announcementDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7; // Show announcements from last 7 days
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getAnnouncementById = (id) => {
    return mockAnnouncements.find(announcement => announcement.id === id);
};
