import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums';
import { UserInterest } from './user-interest.entity';
import { UserBadge } from '../../engagement/entities/user-badge.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    googleId: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    passwordHash: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    surname: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'text', nullable: true })
    profilePicture: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    // Team and Branch
    @Column({ type: 'varchar', length: 100, nullable: true })
    team: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    branch: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ type: 'boolean', default: false })
    isBranchRepresentative: boolean;

    @Column({ type: 'boolean', default: false })
    canCreateEvents: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    authProvider: string;

    @Column({ type: 'boolean', default: false })
    isPremium: boolean;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'none',
    })
    premiumStatus: string;

    @Column({ type: 'timestamp', nullable: true })
    premiumExpiresAt: Date;

    @Column({ type: 'boolean', default: false })
    isBanned: boolean;

    // Club Specific Fields
    @Column({ type: 'int', nullable: true })
    memberCount: number;

    @Column({ type: 'int', nullable: true })
    eventCount: number;

    @Column({ type: 'text', nullable: true })
    clubInfo: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    profileId: string;

    @Column({ type: 'boolean', default: false })
    onboardingComplete: boolean;

    // Email verification fields
    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean;

    @Column({ type: 'varchar', length: 10, nullable: true })
    verificationCode: string;

    @Column({ type: 'timestamp', nullable: true })
    verificationCodeExpiry: Date;

    // Password reset fields
    @Column({ type: 'varchar', length: 10, nullable: true })
    resetPasswordCode: string;

    @Column({ type: 'timestamp', nullable: true })
    resetPasswordCodeExpiry: Date;

    // Brute-force protection
    @Column({ type: 'int', default: 0 })
    failedLoginAttempts: number;

    @Column({ type: 'timestamp', nullable: true })
    lockUntil: Date;

    // 2FA Fields
    @Column({ type: 'boolean', default: false })
    isTwoFactorEnabled: boolean;

    @Column({ type: 'varchar', length: 10, nullable: true })
    twoFactorCode: string;

    @Column({ type: 'timestamp', nullable: true })
    twoFactorCodeExpiry: Date;

    @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
    referralCode: string;

    @Column({ type: 'text', nullable: true })
    refreshToken: string;

    @Column({ type: 'int', nullable: true })
    referredById: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => UserInterest, (interest) => interest.user)
    interests: UserInterest[];

    @OneToMany(() => UserBadge, (badge) => badge.user)
    badges: UserBadge[];
}
