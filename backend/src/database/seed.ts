import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex);
                const value = trimmed.substring(eqIndex + 1);
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    });
}

async function seed() {
    const dbUrl = process.env.DATABASE_URL;
    const dataSourceOptions = dbUrl
        ? {
            type: 'postgres' as const,
            url: dbUrl,
            entities: ['src/**/*.entity.ts'],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
        }
        : {
            type: 'sqlite' as const,
            database: './data/universe.db',
            entities: ['src/**/*.entity.ts'],
            synchronize: true,
        };

    const AppDataSource = new DataSource(dataSourceOptions);
    await AppDataSource.initialize();

    console.log('🌱 Starting comprehensive seed...');
    console.log(`📦 Database: ${dbUrl ? 'PostgreSQL (Supabase)' : 'SQLite'}`);

    const userRepo = AppDataSource.getRepository('User');
    const creditRepo = AppDataSource.getRepository('Credit');
    const connectionRepo = AppDataSource.getRepository('Connection');
    const meetingRepo = AppDataSource.getRepository('Meeting');
    const eventRepo = AppDataSource.getRepository('Event');
    const clubRepo = AppDataSource.getRepository('Club');
    const clubMemberRepo = AppDataSource.getRepository('ClubMember');
    const competitionRepo = AppDataSource.getRepository('Competition');

    // ═══════════════════════════════════════
    // 1. USERS
    // ═══════════════════════════════════════
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    const adminPassword = await bcrypt.hash('Admin123!', 10);

    const usersData = [
        // Admin
        {
            email: 'admin@universe.com',
            passwordHash: adminPassword,
            name: 'System',
            surname: 'Admin',
            profileId: 'admin',
            role: 'admin',
            onboardingComplete: true,
            authProvider: 'email',
            isPremium: true,
            city: 'Istanbul',
            title: 'Platform Yöneticisi',
            bio: 'UniVerse Platform Yöneticisi',
        },
        // Regular Users
        {
            email: 'ali.yilmaz@test.com',
            passwordHash: hashedPassword,
            name: 'Ali',
            surname: 'Yılmaz',
            profileId: 'ali-yilmaz',
            role: 'user',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Istanbul',
            title: 'Bilgisayar Mühendisliği Öğrencisi',
            bio: 'İTÜ Bilgisayar Mühendisliği 3. sınıf öğrencisiyim. Yapay zeka ve makine öğrenmesi alanlarında çalışıyorum.',
        },
        {
            email: 'ayse.demir@test.com',
            passwordHash: hashedPassword,
            name: 'Ayşe',
            surname: 'Demir',
            profileId: 'ayse-demir',
            role: 'user',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Ankara',
            title: 'Endüstri Mühendisliği Öğrencisi',
            bio: 'ODTÜ Endüstri Mühendisliği öğrencisiyim. Proje yönetimi ve veri analitiği ile ilgileniyorum.',
        },
        {
            email: 'mehmet.kaya@test.com',
            passwordHash: hashedPassword,
            name: 'Mehmet',
            surname: 'Kaya',
            profileId: 'mehmet-kaya',
            role: 'user',
            onboardingComplete: true,
            authProvider: 'email',
            isPremium: true,
            city: 'Istanbul',
            title: 'Yazılım Geliştirici',
            bio: 'Full-stack web geliştirme yapıyorum. React, Node.js ve TypeScript.',
        },
        {
            email: 'zeynep.sahin@test.com',
            passwordHash: hashedPassword,
            name: 'Zeynep',
            surname: 'Şahin',
            profileId: 'zeynep-sahin',
            role: 'user',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Izmir',
            title: 'Grafik Tasarım Öğrencisi',
            bio: 'Dokuz Eylül Üniversitesi Grafik Tasarım öğrencisiyim. UI/UX tasarım ile ilgileniyorum.',
        },
        {
            email: 'emre.ozturk@test.com',
            passwordHash: hashedPassword,
            name: 'Emre',
            surname: 'Öztürk',
            profileId: 'emre-ozturk',
            role: 'user',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Ankara',
            title: 'Elektrik-Elektronik Mühendisliği',
            bio: 'Hacettepe Üniversitesi EE öğrencisiyim. IoT ve gömülü sistemler alanında projeler geliştiriyorum.',
        },
        {
            email: 'selin.arslan@test.com',
            passwordHash: hashedPassword,
            name: 'Selin',
            surname: 'Arslan',
            profileId: 'selin-arslan',
            role: 'user',
            onboardingComplete: true,
            authProvider: 'email',
            isPremium: true,
            city: 'Istanbul',
            title: 'İşletme Öğrencisi',
            bio: 'Boğaziçi Üniversitesi İşletme öğrencisiyim. Girişimcilik ve startup ekosistemi ile ilgileniyorum.',
        },
        // Club Presidents
        {
            email: 'club.tech@test.com',
            passwordHash: hashedPassword,
            name: 'Teknoloji',
            surname: 'Kulübü',
            profileId: 'tech-club',
            role: 'club_president',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Istanbul',
            title: 'Teknoloji Kulübü Başkanı',
            bio: 'Üniversite genelinde teknoloji etkinlikleri ve workshop\'lar düzenliyoruz.',
            memberCount: 150,
            eventCount: 25,
            clubInfo: 'Yazılım, donanım ve yapay zeka alanlarında etkinlikler düzenliyoruz.',
        },
        {
            email: 'club.girisim@test.com',
            passwordHash: hashedPassword,
            name: 'Girişimcilik',
            surname: 'Kulübü',
            profileId: 'girisim-club',
            role: 'club_president',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Istanbul',
            title: 'Girişimcilik Kulübü Başkanı',
            bio: 'Startup ekosistemi, yatırımcı buluşmaları ve pitch etkinlikleri düzenliyoruz.',
            memberCount: 120,
            eventCount: 18,
            clubInfo: 'Girişimcilik ruhuyla dolu gençleri bir araya getiriyoruz.',
        },
        {
            email: 'club.tasarim@test.com',
            passwordHash: hashedPassword,
            name: 'Tasarım',
            surname: 'Kulübü',
            profileId: 'tasarim-club',
            role: 'club_president',
            onboardingComplete: true,
            authProvider: 'email',
            city: 'Ankara',
            title: 'Tasarım Kulübü Başkanı',
            bio: 'UI/UX, grafik tasarım ve dijital sanat alanlarında etkinlikler düzenliyoruz.',
            memberCount: 85,
            eventCount: 12,
            clubInfo: 'Tasarım dünyasının kapılarını aralıyoruz.',
        },
    ];

    const savedUsers: any[] = [];
    for (const userData of usersData) {
        const existing = await userRepo.findOne({ where: { email: userData.email } });
        if (!existing) {
            const user = await userRepo.save(userData);
            savedUsers.push(user);
            console.log(`✅ User: ${userData.name} ${userData.surname} (${userData.email})`);
        } else {
            savedUsers.push(existing);
            console.log(`⏭️  User exists: ${userData.email}`);
        }
    }

    // ═══════════════════════════════════════
    // 2. CREDITS
    // ═══════════════════════════════════════
    for (const user of savedUsers) {
        const existingCredit = await creditRepo.findOne({ where: { userId: user.id } });
        if (!existingCredit) {
            await creditRepo.save({
                userId: user.id,
                totalCredits: 10,
                usedCredits: 0,
                availableCredits: 10,
            });
        }
    }
    console.log('✅ Credits created for all users');

    // ═══════════════════════════════════════
    // 3. EVENTS
    // ═══════════════════════════════════════
    const now = new Date();
    const futureDate = (days: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return d;
    };

    const eventsData = [
        {
            title: 'Yapay Zeka ve Gelecek Teknolojileri Zirvesi',
            description: 'Türkiye\'nin önde gelen yapay zeka uzmanları ile gelecek teknolojiler üzerine kapsamlı bir panel. Machine Learning, Deep Learning ve NLP konularında sunumlar yapılacak.',
            eventType: 'standard',
            paymentType: 'free',
            date: futureDate(7),
            location: 'İTÜ Süleyman Demirel Kültür Merkezi',
            city: 'Istanbul',
            isOnline: false,
            participantLimit: 200,
            currentParticipants: 145,
            status: 'approved',
            createdBy: savedUsers[7]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
        },
        {
            title: 'React & Next.js Workshop',
            description: 'Modern web geliştirme araçlarını öğrenmek isteyenler için uygulamalı workshop. Sıfırdan bir proje geliştireceğiz.',
            eventType: 'standard',
            paymentType: 'free',
            date: futureDate(14),
            location: 'Online',
            city: 'Istanbul',
            isOnline: true,
            zoomLink: 'https://zoom.us/j/example',
            participantLimit: 100,
            currentParticipants: 67,
            status: 'approved',
            createdBy: savedUsers[7]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
        },
        {
            title: 'Startup Pitch Night',
            description: 'Genç girişimcilerin projelerini yatırımcılara sunduğu gece. 5 dakikalık pitch\'ler ve networking fırsatı.',
            eventType: 'standard',
            paymentType: 'free',
            date: futureDate(10),
            location: 'Boğaziçi Üniversitesi Uçak Fabrikası',
            city: 'Istanbul',
            isOnline: false,
            participantLimit: 150,
            currentParticipants: 89,
            status: 'approved',
            createdBy: savedUsers[8]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
        },
        {
            title: 'UI/UX Tasarım Atölyesi',
            description: 'Figma ile mobil uygulama tasarımı. Temel prensiplerden ileri tekniklere kapsamlı bir atölye çalışması.',
            eventType: 'standard',
            paymentType: 'paid',
            price: 50,
            date: futureDate(21),
            location: 'ODTÜ Tasarım Merkezi',
            city: 'Ankara',
            isOnline: false,
            participantLimit: 50,
            currentParticipants: 32,
            status: 'approved',
            createdBy: savedUsers[9]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
        },
        {
            title: 'Blockchain ve Web3 Paneli',
            description: 'Blockchain teknolojisi, akıllı kontratlar ve merkeziyetsiz finans (DeFi) konularında uzman panel.',
            eventType: 'standard',
            paymentType: 'free',
            date: futureDate(5),
            location: 'Online',
            city: 'Istanbul',
            isOnline: true,
            zoomLink: 'https://zoom.us/j/blockchain',
            participantLimit: 300,
            currentParticipants: 178,
            status: 'approved',
            createdBy: savedUsers[7]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
        },
        {
            title: 'Üniversiteler Arası Hackathon Bilgilendirme',
            description: '2026 UniVerse Hackathon hakkında bilgilendirme toplantısı. Kurallar, kategoriler ve ödüller hakkında detaylı bilgi.',
            eventType: 'standard',
            paymentType: 'free',
            date: futureDate(3),
            location: 'Yıldız Teknik Üniversitesi',
            city: 'Istanbul',
            isOnline: false,
            participantLimit: 250,
            currentParticipants: 198,
            status: 'approved',
            createdBy: savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: false,
        },
        {
            title: 'Veri Bilimi ve Python Eğitimi',
            description: 'Python ile veri analizi, görselleştirme ve temel makine öğrenmesi konularında 2 günlük eğitim programı.',
            eventType: 'standard',
            paymentType: 'paid',
            price: 75,
            date: futureDate(30),
            location: 'Bilkent Üniversitesi',
            city: 'Ankara',
            isOnline: false,
            participantLimit: 80,
            currentParticipants: 45,
            status: 'approved',
            createdBy: savedUsers[9]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
        },
        {
            title: 'Mobil Uygulama Geliştirme Circle',
            description: 'Flutter ve React Native ile mobil uygulama geliştirme deneyimlerini paylaştığımız sohbet topluluğu.',
            eventType: 'circle',
            paymentType: 'free',
            date: futureDate(12),
            location: 'Online',
            city: 'Izmir',
            isOnline: true,
            zoomLink: 'https://zoom.us/j/mobiledev',
            participantLimit: 30,
            currentParticipants: 18,
            status: 'approved',
            createdBy: savedUsers[7]?.id || savedUsers[0].id,
            approvedBy: savedUsers[0].id,
            requiresFeedback: true,
            circleFormat: 'Her katılımcı 5 dakikalık deneyim paylaşımı yapar.',
        },
    ];

    for (const eventData of eventsData) {
        const existing = await eventRepo.findOne({ where: { title: eventData.title } });
        if (!existing) {
            await eventRepo.save(eventData);
            console.log(`✅ Event: ${eventData.title}`);
        } else {
            console.log(`⏭️  Event exists: ${eventData.title}`);
        }
    }

    // ═══════════════════════════════════════
    // 4. CLUBS
    // ═══════════════════════════════════════
    const clubsData = [
        {
            name: 'Yazılım ve Teknoloji Kulübü',
            description: 'Yazılım geliştirme, açık kaynak projeler ve hackathon\'lar düzenleyen aktif bir teknoloji topluluğu.',
            city: 'Istanbul',
            memberCount: 150,
            presidentId: savedUsers[7]?.id || savedUsers[0].id,
            isApproved: 1,
        },
        {
            name: 'Girişimcilik ve İnovasyon Kulübü',
            description: 'Startup ekosistemi, mentor buluşmaları ve yatırımcı panelleri düzenleyen kulüp.',
            city: 'Istanbul',
            memberCount: 120,
            presidentId: savedUsers[8]?.id || savedUsers[0].id,
            isApproved: 1,
        },
        {
            name: 'Tasarım ve Sanat Kulübü',
            description: 'UI/UX, grafik tasarım, dijital sanat ve portfolyo geliştirme etkinlikleri düzenleyen kulüp.',
            city: 'Ankara',
            memberCount: 85,
            presidentId: savedUsers[9]?.id || savedUsers[0].id,
            isApproved: 1,
        },
        {
            name: 'Yapay Zeka Araştırma Kulübü',
            description: 'Makine öğrenmesi, derin öğrenme ve doğal dil işleme konularında araştırma ve seminerler düzenler.',
            city: 'Istanbul',
            memberCount: 95,
            presidentId: savedUsers[1]?.id || savedUsers[0].id,
            isApproved: 1,
        },
        {
            name: 'Siber Güvenlik Kulübü',
            description: 'CTF yarışmaları, güvenlik workshop\'ları ve penetration test eğitimleri düzenleyen kulüp.',
            city: 'Ankara',
            memberCount: 70,
            presidentId: savedUsers[4]?.id || savedUsers[0].id,
            isApproved: 1,
        },
        {
            name: 'Robotik ve Otomasyon Kulübü',
            description: 'Robot tasarımı, Arduino projeleri ve otomasyon yarışmalarına katılan aktif bir kulüp.',
            city: 'Izmir',
            memberCount: 60,
            presidentId: savedUsers[3]?.id || savedUsers[0].id,
            isApproved: 1,
        },
    ];

    const savedClubs: any[] = [];
    for (const clubData of clubsData) {
        const existing = await clubRepo.findOne({ where: { name: clubData.name } });
        if (!existing) {
            const club = await clubRepo.save(clubData);
            savedClubs.push(club);
            console.log(`✅ Club: ${clubData.name}`);
        } else {
            savedClubs.push(existing);
            console.log(`⏭️  Club exists: ${clubData.name}`);
        }
    }

    // ═══════════════════════════════════════
    // 5. CLUB MEMBERS
    // ═══════════════════════════════════════
    const memberPairs = [
        { clubIdx: 0, userIdx: 1, role: 'member' },
        { clubIdx: 0, userIdx: 2, role: 'member' },
        { clubIdx: 0, userIdx: 3, role: 'member' },
        { clubIdx: 1, userIdx: 5, role: 'member' },
        { clubIdx: 1, userIdx: 6, role: 'member' },
        { clubIdx: 2, userIdx: 3, role: 'member' },
        { clubIdx: 2, userIdx: 4, role: 'member' },
        { clubIdx: 3, userIdx: 1, role: 'president' },
        { clubIdx: 4, userIdx: 4, role: 'president' },
        { clubIdx: 5, userIdx: 3, role: 'president' },
    ];

    for (const mp of memberPairs) {
        if (savedClubs[mp.clubIdx] && savedUsers[mp.userIdx]) {
            const existing = await clubMemberRepo.findOne({
                where: { clubId: savedClubs[mp.clubIdx].id, userId: savedUsers[mp.userIdx].id }
            });
            if (!existing) {
                await clubMemberRepo.save({
                    clubId: savedClubs[mp.clubIdx].id,
                    userId: savedUsers[mp.userIdx].id,
                    role: mp.role,
                });
            }
        }
    }
    console.log('✅ Club members assigned');

    // ═══════════════════════════════════════
    // 6. COMPETITIONS
    // ═══════════════════════════════════════
    const competitionsData = [
        {
            title: 'UniVerse Hackathon 2026',
            description: 'Türkiye\'nin en büyük üniversiteler arası hackathon\'u! 48 saat boyunca takımlar halinde yenilikçi projeler geliştirin.',
            category: 'Yazılım',
            prize: '50.000 TL + Staj Fırsatı',
            deadline: futureDate(45),
            startDate: futureDate(40),
            participantCount: 250,
            status: 'active',
        },
        {
            title: 'Startup Idea Challenge',
            description: 'En yenilikçi startup fikrinizi sunun! Jüri değerlendirmesi ve yatırımcı feedback\'i ile fikrinizi geliştirin.',
            category: 'Girişimcilik',
            prize: '25.000 TL + Kuluçka Merkezi Desteği',
            deadline: futureDate(30),
            startDate: futureDate(25),
            participantCount: 120,
            status: 'active',
        },
        {
            title: 'AI Art Competition',
            description: 'Yapay zeka araçlarını kullanarak sanat eserleri üretin. Yaratıcılık ve teknik bilgiyi bir arada gösterin.',
            category: 'Tasarım',
            prize: '10.000 TL',
            deadline: futureDate(20),
            startDate: futureDate(15),
            participantCount: 80,
            status: 'active',
        },
        {
            title: 'Mobil Uygulama Yarışması',
            description: 'Sosyal fayda sağlayan bir mobil uygulama geliştirin. Flutter veya React Native kullanabilirsiniz.',
            category: 'Yazılım',
            prize: '30.000 TL + Mentor Desteği',
            deadline: futureDate(60),
            startDate: futureDate(50),
            participantCount: 0,
            status: 'active',
        },
        {
            title: 'Veri Bilimi Challenge',
            description: 'Gerçek dünya veri setleri üzerinde analiz ve modelleme yapın. Kaggle tarzı bir yarışma formati.',
            category: 'Veri Bilimi',
            prize: '15.000 TL',
            deadline: futureDate(35),
            startDate: futureDate(28),
            participantCount: 65,
            status: 'active',
        },
    ];

    for (const compData of competitionsData) {
        const existing = await competitionRepo.findOne({ where: { title: compData.title } });
        if (!existing) {
            await competitionRepo.save(compData);
            console.log(`✅ Competition: ${compData.title}`);
        } else {
            console.log(`⏭️  Competition exists: ${compData.title}`);
        }
    }

    // ═══════════════════════════════════════
    // 7. CONNECTIONS
    // ═══════════════════════════════════════
    const connectionPairs = [
        { user1Idx: 1, user2Idx: 2 },
        { user1Idx: 1, user2Idx: 3 },
        { user1Idx: 2, user2Idx: 5 },
        { user1Idx: 3, user2Idx: 4 },
        { user1Idx: 5, user2Idx: 6 },
    ];

    const savedConnections: any[] = [];
    for (const cp of connectionPairs) {
        if (savedUsers[cp.user1Idx] && savedUsers[cp.user2Idx]) {
            const existing = await connectionRepo.findOne({
                where: { user1Id: savedUsers[cp.user1Idx].id, user2Id: savedUsers[cp.user2Idx].id }
            });
            if (!existing) {
                const conn = await connectionRepo.save({
                    user1Id: savedUsers[cp.user1Idx].id,
                    user2Id: savedUsers[cp.user2Idx].id,
                });
                savedConnections.push(conn);
            }
        }
    }
    console.log('✅ Connections created');

    // ═══════════════════════════════════════
    // 8. MEETINGS
    // ═══════════════════════════════════════
    if (savedConnections.length > 0) {
        const meetingDate = futureDate(2);
        meetingDate.setHours(14, 0, 0, 0);

        const existingMeetings = await meetingRepo.find();
        if (existingMeetings.length === 0) {
            await meetingRepo.save({
                connectionId: savedConnections[0].id,
                scheduledDate: meetingDate,
                location: 'Online',
                isOnline: true,
                jitsiRoomId: `universe-meeting-${savedConnections[0].id}-${Date.now()}`,
                status: 'scheduled',
            });
            console.log('✅ Meeting created');
        }
    }

    // ═══════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════
    console.log('\n📋 ═══════════════════════════════════');
    console.log('📋 Seed Data Summary');
    console.log('═══════════════════════════════════');
    console.log(`👤 Admin: admin@universe.com / Admin123!`);
    console.log(`👤 Users: ali.yilmaz@test.com / Test123!`);
    console.log(`👤        ayse.demir@test.com / Test123!`);
    console.log(`👤        mehmet.kaya@test.com / Test123!`);
    console.log(`👤        zeynep.sahin@test.com / Test123!`);
    console.log(`👤        emre.ozturk@test.com / Test123!`);
    console.log(`👤        selin.arslan@test.com / Test123!`);
    console.log(`🏢 Club Presidents: club.tech@test.com / Test123!`);
    console.log(`🏢                  club.girisim@test.com / Test123!`);
    console.log(`🏢                  club.tasarim@test.com / Test123!`);
    console.log(`📅 ${eventsData.length} Events created`);
    console.log(`🏢 ${clubsData.length} Clubs created`);
    console.log(`🏆 ${competitionsData.length} Competitions created`);
    console.log(`🔗 ${connectionPairs.length} Connections created`);
    console.log('═══════════════════════════════════');
    console.log('🎉 Seed completed!');

    await AppDataSource.destroy();
}

seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
