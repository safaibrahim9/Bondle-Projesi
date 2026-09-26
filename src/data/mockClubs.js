export const mockClubs = [
    { 
        id: 1, 
        name: 'İÜ Uzay Havacılık', 
        description: 'İstanbul Üniversitesi Uzay ve Havacılık Kulübü. Uzay teknolojileri, havacılık, model roket ve İHA projeleri üzerine çalışan teknik ve sosyal bir topluluk.', 
        city: 'İstanbul', 
        isPremium: false, 
        memberCount: 150, 
        logo: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=400', 
        categories: ['Teknoloji', 'Yazılım'], 
        foundedDate: '2023-09-15', 
        managementTeam: [1], 
        upcomingEvents: [], 
        socialLinks: {}, 
        analytics: null 
    },
    { 
        id: 2, 
        name: 'Girişimcilik ve Ötesi', 
        description: 'Girişimcilik ekosistemi, startuplar ve yenilikçi fikirler üzerine odaklanan, geleceğin kurucularını bir araya getiren vizyoner topluluk.', 
        city: 'Online', 
        isPremium: false, 
        memberCount: 220, 
        logo: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', 
        categories: ['Girişimcilik', 'Kariyer'], 
        foundedDate: '2024-02-10', 
        managementTeam: [1], 
        upcomingEvents: [], 
        socialLinks: {}, 
        analytics: null 
    },
    { 
        id: 3, 
        name: 'Animasyon ve Film Atölyesi', 
        description: 'Animasyon ve Film Atölyesi Kulübü; teknoloji ve sanat odaklı, eğlenceyi merkeze alan sosyal bir topluluktur. Ünides projesi kapsamında TEDx Derinkuyu ve NEVFEST 2025 gibi büyük etkinlikler gerçekleştirilmiştir. Film geceleri, yarışmalar, cosplay etkinlikleri ve sosyal buluşmalarla üyelerine keyifli vakit geçirme ve yeni insanlarla tanışma fırsatı sunar.', 
        city: 'Online', 
        isPremium: false, 
        memberCount: 180, 
        logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', 
        categories: ['Sanat', 'Eğlence'], 
        foundedDate: '2023-11-20', 
        managementTeam: [1], 
        upcomingEvents: [], 
        socialLinks: {}, 
        analytics: null 
    },
    { 
        id: 4, 
        name: 'KTÜ YBS', 
        description: 'Karadeniz Teknik Üniversitesi Yönetim Bilişim Sistemleri Kulübü. Bilişim, yazılım, veri bilimi ve işletme alanlarında etkinlikler düzenleyen topluluk.', 
        city: 'Trabzon', 
        isPremium: false, 
        memberCount: 200, 
        logo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400', 
        categories: ['Teknoloji', 'Kariyer'], 
        foundedDate: '2022-10-05', 
        managementTeam: [1], 
        upcomingEvents: [], 
        socialLinks: {}, 
        analytics: null 
    }
];

// Helper functions
export const getClubById = (id) => mockClubs.find((club) => club.id === id);
export const getClubsByCity = (city) => (!city || city === 'all') ? mockClubs : mockClubs.filter((club) => club.city === city);
export const getPremiumClubs = () => mockClubs.filter((club) => club.isPremium).sort((a, b) => b.memberCount - a.memberCount);
export const getRegularClubs = () => mockClubs.filter((club) => !club.isPremium);
export const getAllClubsSorted = () => [...getPremiumClubs(), ...getRegularClubs()];
export const getClubsByCategory = (category) => mockClubs.filter((club) => club.categories.includes(category));
