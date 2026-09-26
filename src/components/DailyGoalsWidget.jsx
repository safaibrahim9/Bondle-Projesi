import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, Target, Loader2 } from 'lucide-react';
import './DailyGoalsWidget.css';

const DailyGoalsWidget = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const data = await api.getDailyGoals();
            setGoals(data);
        } catch (err) {
            console.error('Failed to fetch daily goals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (key) => {
        // Prevent re-completing
        const goal = goals.find(g => g.key === key);
        if (goal?.completed) return;

        try {
            // Optimistic update
            setGoals(goals.map(g => g.key === key ? { ...g, completed: true } : g));
            await api.completeDailyGoal(key);
        } catch (err) {
            console.error('Failed to complete goal:', err);
            // Rollback if needed
            fetchGoals();
        }
    };

    const completedCount = goals.filter(g => g.completed).length;
    const progressPercent = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

    if (loading && goals.length === 0) {
        return (
            <div className="daily-goals-widget">
                <div className="daily-goals-loading">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            </div>
        );
    }

    return (
        <div className="daily-goals-widget">
            <div className="daily-goals-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} color="var(--color-primary)" />
                    <h3>Bugünkü Hedeflerin</h3>
                </div>
                <span className="daily-goals-progress-text">%{Math.round(progressPercent)}</span>
            </div>

            <div className="progress-bar-container">
                <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="goals-list">
                {goals.map(goal => (
                    <div 
                        key={goal.key} 
                        className={`goal-item ${goal.completed ? 'completed' : ''}`}
                        onClick={() => handleComplete(goal.key)}
                        style={{ cursor: goal.completed ? 'default' : 'pointer' }}
                    >
                        <div className="goal-check">
                            {goal.completed && <Check size={12} color="#fff" strokeWidth={4} />}
                        </div>
                        <span className="goal-label">{goal.label}</span>
                        {!goal.completed && <span className="goal-reward">+1 Kredi</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyGoalsWidget;
