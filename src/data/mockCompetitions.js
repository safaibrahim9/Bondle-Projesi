import { turkishCities } from './turkishCities';

const mockCompetitions = [
    {
        id: 1,
        name: 'UniVerse Startup Challenge 2024',
        city: 'İstanbul',
        description: 'Teknoloji odaklı startup yarışması. En iyi iş fikrinizi sunun ve kazanın!',
        participantCount: 45,
        deadline: '2024-03-15',
        prize: '50.000 TL',
        categories: ['Teknoloji', 'Startup', 'İnovasyon']
    },
    {
        id: 2,
        name: 'Sosyal Etki Hackathon',
        city: 'Ankara',
        description: 'Toplumsal sorunlara teknolojik çözümler üreten 48 saatlik hackathon.',
        participantCount: 32,
        deadline: '2024-03-20',
        prize: '30.000 TL',
        categories: ['Sosyal Etki', 'Hackathon', 'Teknoloji']
    },
    {
        id: 3,
        name: 'Sürdürülebilirlik Fikir Maratonu',
        city: 'İzmir',
        description: 'Çevre ve sürdürülebilirlik odaklı proje geliştirme yarışması.',
        participantCount: 28,
        deadline: '2024-03-25',
        prize: '25.000 TL',
        categories: ['Sürdürülebilirlik', 'Çevre', 'İnovasyon']
    },
    {
        id: 4,
        name: 'AI & Machine Learning Challenge',
        city: 'İstanbul',
        description: 'Yapay zeka ve makine öğrenmesi alanında problem çözme yarışması.',
        participantCount: 56,
        deadline: '2024-04-01',
        prize: '75.000 TL',
        categories: ['AI', 'Machine Learning', 'Teknoloji']
    },
    {
        id: 5,
        name: 'Eğitimde Dijital Dönüşüm',
        city: 'Bursa',
        description: 'Eğitim sektörüne yönelik dijital çözümler geliştirme yarışması.',
        participantCount: 24,
        deadline: '2024-04-05',
        prize: '35.000 TL',
        categories: ['Eğitim', 'EdTech', 'Dijital']
    },
    {
        id: 6,
        name: 'Fintech Innovation Summit',
        city: 'İstanbul',
        description: 'Finans teknolojileri alanında yenilikçi çözümler sunan yarışma',
        participantCount: 41,
        deadline: '2024-04-10',
        prize: '60.000 TL',
        categories: ['Fintech', 'Finans', 'Teknoloji']
    },
    {
        id: 7,
        name: 'Sağlık Teknolojileri Yarışması',
        city: 'Ankara',
        description: 'Sağlık sektöründe dijital dönüşüm ve yenilikçi çözümler.',
        participantCount: 19,
        deadline: '2024-04-15',
        prize: '40.000 TL',
        categories: ['HealthTech', 'Sağlık', 'Dijital']
    },
    {
        id: 8,
        name: 'Gaming & Esports Challenge',
        city: 'İzmir',
        description: 'Oyun geliştirme ve e-spor alanında yeteneklerin yarıştığı turnuva.',
        participantCount: 67,
        deadline: '2024-04-20',
        prize: '45.000 TL',
        categories: ['Gaming', 'Esports', 'Teknoloji']
    },
    {
        id: 9,
        name: 'Blockchain & Web3 Hackathon',
        city: 'İstanbul',
        description: 'Blockchain teknolojisi ve Web3 uygulamaları geliştirme yarışması.',
        participantCount: 38,
        deadline: '2024-04-25',
        prize: '80.000 TL',
        categories: ['Blockchain', 'Web3', 'Kripto']
    },
    {
        id: 10,
        name: 'Tarım & AgriTech İnovasyon',
        city: 'Konya',
        description: 'Tarım sektöründe teknoloji kullanımı ve akıllı tarım çözümleri.',
        participantCount: 15,
        deadline: '2024-04-30',
        prize: '30.000 TL',
        categories: ['AgriTech', 'Tarım', 'IoT']
    }
];

// Get all competitions sorted by deadline
export const getAllCompetitions = () => {
    return [...mockCompetitions].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
};

// Get competitions by city
export const getCompetitionsByCity = (city) => {
    return mockCompetitions.filter(comp => comp.city === city)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
};

// Get competition by ID
export const getCompetitionById = (id) => {
    return mockCompetitions.find(comp => comp.id === parseInt(id));
};

// Get all unique cities that have competitions
export const getCompetitionCities = () => {
    const cities = [...new Set(mockCompetitions.map(comp => comp.city))];
    return cities.sort();
};

export default mockCompetitions;
