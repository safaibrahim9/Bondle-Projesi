import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClubGalleryImage } from './club-gallery-image.entity';

@Entity('clubs')
export class Club {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ type: 'int', default: 0 })
    memberCount: number;

    @Column({ type: 'int', nullable: true })
    presidentId: number;

    @Column({ type: 'int', default: 0 }) // 0 = pending, 1 = approved, 2 = rejected
    isApproved: number;

    @Column({ type: 'text', nullable: true })
    rejectionReason: string;

    @Column({ type: 'simple-array', nullable: true })
    categories: string[];

    @Column({ type: 'varchar', length: 255, nullable: true })
    instagramUrl: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    linkedinUrl: string;

    @OneToMany(() => ClubGalleryImage, (image) => image.club)
    gallery: ClubGalleryImage[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'presidentId' })
    president: User;
}
