import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function createAdmin() {
    const AppDataSource = new DataSource({
        type: 'sqlite',
        database: './data/universe.db',
        entities: ['src/**/*.entity.ts'],
        synchronize: true, // Changed to true to update schema
    });

    try {
        await AppDataSource.initialize();
        console.log('🌱 Connected to database...');

        const userRepo = AppDataSource.getRepository('User');

        // Check if admin exists
        const email = 'admin@universe.com';
        const existingAdmin = await userRepo.findOne({ where: { email } });

        if (existingAdmin) {
            console.log('⚠️ Admin already exists. Deleting to ensure clean state...');
            await userRepo.remove(existingAdmin);
        }

        console.log('🌱 Creating new admin user...');
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        const newAdmin = userRepo.create({
            email: email,
            passwordHash: hashedPassword,
            name: 'System',
            surname: 'Admin',
            profileId: 'admin-' + Date.now(),
            role: 'admin',
            onboardingComplete: true,
            city: 'Istanbul',
            bio: 'System Administrator',
            authProvider: 'email',
            isPremium: true
        });

        await userRepo.save(newAdmin);
        console.log('✅ Admin User Successfully Created!');
        console.log('📧 Email: admin@universe.com');
        console.log('🔑 Password: Admin123!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

createAdmin();
