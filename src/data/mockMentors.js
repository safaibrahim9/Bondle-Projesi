export const mockMentors = [
    {
        id: 1,
        name: 'Dr. Elif Yıldırım',
        area: 'Psychology',
        isPaid: true,
        price: 200,
        bio: 'Klinik psikolog, 10 yıllık deneyim. Kariyer psikolojisi ve kişisel gelişim uzmanı.',
        expertise: ['Career Psychology', 'Personal Development', 'Anxiety Management'],
        availability: ['Pazartesi 14:00-17:00', 'Çarşamba 10:00-13:00', 'Cuma 14:00-18:00'],
        rating: 4.8,
        totalSessions: 85,
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        languages: ['Türkçe', 'İngilizce'],
    },
    {
        id: 2,
        name: 'Ahmet Kaya',
        area: 'Technology',
        isPaid: false,
        price: 0,
        bio: 'Senior software engineer, full-stack development mentor. 12 yıllık sektör deneyimi.',
        expertise: ['React', 'Node.js', 'System Design', 'Career Guidance'],
        availability: ['Salı 19:00-21:00', 'Perşembe 19:00-21:00', 'Cumartesi 10:00-12:00'],
        rating: 4.9,
        totalSessions: 120,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        languages: ['Türkçe', 'İngilizce'],
    },
    {
        id: 3,
        name: 'Zeynep Arslan',
        area: 'Business',
        isPaid: false,
        price: 0,
        bio: 'Startup kurucusu ve angel investor. Girişimcilik ve iş geliştirme mentorluğu.',
        expertise: ['Entrepreneurship', 'Business Development', 'Fundraising', 'Pitch Preparation'],
        availability: ['Çarşamba 15:00-17:00', 'Cuma 10:00-12:00'],
        rating: 4.7,
        totalSessions: 65,
        photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
        languages: ['Türkçe'],
    },
    {
        id: 4,
        name: 'Dr. Can Öztürk',
        area: 'Psychology',
        isPaid: true,
        price: 250,
        bio: 'Organizasyonel psikolog, liderlik ve ekip yönetimi uzmanı.',
        expertise: ['Leadership', 'Team Management', 'Organizational Psychology', 'Conflict Resolution'],
        availability: ['Pazartesi 16:00-19:00', 'Perşembe 14:00-17:00'],
        rating: 4.9,
        totalSessions: 95,
        photo: 'https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?w=400',
        languages: ['Türkçe', 'İngilizce'],
    },
    {
        id: 5,
        name: 'Ayşe Yılmaz',
        area: 'Design',
        isPaid: false,
        price: 0,
        bio: 'Principal UX Designer, tasarım kariyer mentorluğu ve portfolio incelemesi.',
        expertise: ['UX Design', 'UI Design', 'Design Career', 'Portfolio Review'],
        availability: ['Salı 18:00-20:00', 'Cumartesi 14:00-16:00'],
        rating: 4.8,
        totalSessions: 78,
        photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400',
        languages: ['Türkçe', 'İngilizce'],
    },
    {
        id: 6,
        name: 'Mehmet Demir',
        area: 'Marketing',
        isPaid: false,
        price: 0,
        bio: 'Dijital pazarlama direktörü, 15 yıllık deneyim. Social media ve content strategy uzmanı.',
        expertise: ['Digital Marketing', 'Social Media Strategy', 'Content Marketing', 'SEO'],
        availability: ['Çarşamba 19:00-21:00', 'Pazar 10:00-12:00'],
        rating: 4.6,
        totalSessions: 55,
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
        languages: ['Türkçe'],
    },
    {
        id: 7,
        name: 'Burak Şahin',
        area: 'Technology',
        isPaid: false,
        price: 0,
        bio: 'Data scientist ve AI engineer. Makine öğrenmesi ve veri bilimi mentorluğu.',
        expertise: ['Data Science', 'Machine Learning', 'Python', 'AI'],
        availability: ['Pazartesi 20:00-22:00', 'Cumartesi 16:00-18:00'],
        rating: 4.9,
        totalSessions: 92,
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        languages: ['Türkçe', 'İngilizce'],
    },
];

// Helper functions
export const getMentorById = (id) => {
    return mockMentors.find((mentor) => mentor.id === id);
};

export const getMentorsByArea = (area) => {
    if (!area || area === 'all') return mockMentors;
    return mockMentors.filter((mentor) => mentor.area === area);
};

export const getPaidMentors = () => {
    return mockMentors.filter((mentor) => mentor.isPaid);
};

export const getFreeMentors = () => {
    return mockMentors.filter((mentor) => !mentor.isPaid);
};

export const getMentorAreas = () => {
    return [...new Set(mockMentors.map((mentor) => mentor.area))];
};
