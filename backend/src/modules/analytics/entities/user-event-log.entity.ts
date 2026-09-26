import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_event_logs')
export class UserEventLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ type: 'varchar', length: 100 })
    eventType: string; // e.g., 'click', 'search', 'conversion'

    @Column({ type: 'varchar', length: 255 })
    eventName: string; // e.g., 'register_button_click', 'club_join', 'search_query'

    @Column({ type: 'json', nullable: true })
    metadata: any; // e.g., { query: 'AI', eventId: 123, step: 1 }

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
