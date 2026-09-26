import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('daily_answers')
export class DailyAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ type: 'text' })
    question: string;

    @Column({ type: 'text' })
    answer: string;

    @Column({ type: 'int', nullable: true })
    rank: number; // 1, 2, or 3 for podium

    @CreateDateColumn()
    createdAt: Date;
}
