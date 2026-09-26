import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async onApplicationBootstrap() {
        // Automatically ensure creatorId column exists in meetings table for new feature
        try {
            await this.userRepository.query(`ALTER TABLE meetings ADD COLUMN "creatorId" integer`);
            console.log('✅ Added creatorId column to meetings table');
        } catch (e) {
            // Column already exists or error, ignore
        }

        if (process.env.RUN_SEED === 'true') {
            console.log('🌱 RUN_SEED is true, running seed operations...');
            await this.cleanupOrphanedBadges();
            await this.seedAdmin();
            // await this.seedClubs(); // Disabled to allow permanent deletion of default clubs
        } else {
            console.log('🌱 Skipping seed operations. Set RUN_SEED=true to enable.');
        }
    }

    async seedClubs() {
        try {
            console.log('🌱 Checking clubs seeding...');
            const admin = await this.userRepository.findOne({ where: { role: UserRole.ADMIN } });
            
            const clubs = [
                {
                    name: 'UniVerse Teknoloji Kulübü',
                    description: 'Yazılım, Yapay Zeka ve yeni nesil teknolojiler üzerine projeler geliştiren topluluk.',
                    city: 'İstanbul',
                    memberCount: 156,
                    isApproved: 1,
                    presidentId: admin?.id,
                    logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop'
                },
                {
                    name: 'Girişimcilik ve Ötesi',
                    description: 'Kendi startup fikrini hayata geçirmek isteyen üniversitelilerin buluşma noktası.',
                    city: 'Ankara',
                    memberCount: 89,
                    isApproved: 1,
                    presidentId: admin?.id,
                    logoUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=200&h=200&fit=crop'
                },
                {
                    name: 'Sanat ve Tasarım Topluluğu',
                    description: 'Dijital sanat, grafik tasarım ve geleneksel sanat dallarında atölye çalışmaları.',
                    city: 'İzmir',
                    memberCount: 42,
                    isApproved: 1,
                    presidentId: admin?.id,
                    logoUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop'
                }
            ];

            for (const club of clubs) {
                // Check if club with this name or similar name exists
                const existing = await this.userRepository.query(`
                    SELECT id FROM clubs WHERE name = $1 OR name = 'Girişimcilik ve İnovasyon'
                `, [club.name]);

                if (existing.length > 0) {
                    // Update existing
                    await this.userRepository.query(`
                        UPDATE clubs SET name = $1, description = $2, "logoUrl" = $3 
                        WHERE id = $4
                    `, [club.name, club.description, club.logoUrl, existing[0].id]);
                } else {
                    // Insert new
                    await this.userRepository.query(`
                        INSERT INTO clubs (name, description, city, "memberCount", "isApproved", "presidentId", "logoUrl", "createdAt", "updatedAt")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    `, [club.name, club.description, club.city, club.memberCount, club.isApproved, club.presidentId, club.logoUrl]);
                }
            }
            console.log('✅ Initial clubs seeded/updated successfully.');
        } catch (error) {
            console.warn('⚠️ Error seeding clubs:', error.message);
        }
    }

    async cleanupOrphanedBadges() {
        try {
            console.log('🧹 Cleaning up orphaned badges...');
            await this.userRepository.query(`
                DELETE FROM user_badges 
                WHERE "userId" NOT IN (SELECT id FROM users)
            `);
            console.log('✅ Orphaned badges cleanup complete.');
        } catch (error) {
            console.warn('⚠️ Could not clean up orphaned badges:', error.message);
        }
    }

    async seedAdmin() {
        const adminEmail = 'admin@universe.com';
        const existingAdmin = await this.userRepository.findOne({
            where: { email: adminEmail },
        });

        if (!existingAdmin) {
            console.log('🌱 Creating default admin account...');
            const hashedPassword = await bcrypt.hash('Admin123!', 10);

            const admin = this.userRepository.create({
                email: adminEmail,
                passwordHash: hashedPassword,
                name: 'System',
                surname: 'Admin',
                profileId: 'admin',
                role: UserRole.ADMIN,
                onboardingComplete: true,
                authProvider: 'email',
                isPremium: true,
            });

            await this.userRepository.save(admin);
            console.log('✅ Admin account created: admin@universe.com / Admin123!');
        } else {
            console.log('✅ Admin account already exists.');
        }
    }
}
