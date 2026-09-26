import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Club } from './club.entity';

@Entity('club_gallery_images')
export class ClubGalleryImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    imageUrl: string;

    @Column({ nullable: true })
    caption: string;

    @Column({ nullable: true })
    eventName: string;

    @Column()
    clubId: number;

    @ManyToOne(() => Club, (club) => club.gallery)
    club: Club;

    @Column({ default: 0 })
    displayOrder: number;

    @CreateDateColumn()
    createdAt: Date;
}
