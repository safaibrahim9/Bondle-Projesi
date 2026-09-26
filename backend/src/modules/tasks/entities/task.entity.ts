import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: false })
    isCompleted: boolean;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'json', nullable: true })
    tableData: any; // Used for Excel-like table data

    @Column({ type: 'timestamp', nullable: true })
    dueDate: Date; // Görev bitiş tarihi

    @Column({ type: 'text', nullable: true })
    pinnedMessage: string; // Sabit mesaj - her zaman görünür

    @Column({ type: 'varchar', length: 2048, nullable: true })
    pinnedLink: string; // Sabit link - her zaman görünür

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignedToId' })
    assignedTo: User;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'assignedById' })
    assignedBy: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
