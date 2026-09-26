import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle, Clock, Calendar, MessageSquare, ExternalLink, Plus } from 'lucide-react';
import api from '../../services/api';

    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        const formatted = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
        return { formatted, diffDays };
    };

const TaskCard = ({ task, taskNotes, setTaskNotes, setMyTasks, showToast }) => {
        let currentTable = taskNotes[task.id]?.tableData || task.tableData;
        if (!currentTable || Array.isArray(currentTable)) {
            currentTable = {
                headers: ['Sütun 1', 'Sütun 2', 'Sütun 3'],
                rows: Array.isArray(currentTable) && currentTable.length > 0
                    ? currentTable.map(r => [r.col1 || '', r.col2 || '', r.col3 || ''])
                    : [['', '', '']]
            };
        }

        const dueDateInfo = formatDate(task.dueDate);
        const isOverdue = dueDateInfo && dueDateInfo.diffDays < 0 && !task.isCompleted;
        const isDueSoon = dueDateInfo && dueDateInfo.diffDays >= 0 && dueDateInfo.diffDays <= 3 && !task.isCompleted;

        return (
            <div style={{
                background: 'var(--color-bg-secondary)',
                borderRadius: '16px',
                border: `2px solid ${task.isCompleted ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : 'var(--color-border)'}`,
                marginBottom: '16px',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s ease'
            }}>
                {/* Task Header */}
                <div style={{
                    padding: '20px',
                    background: task.isCompleted
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent)'
                        : 'transparent',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>
                                    {task.title}
                                </h3>
                                {task.isCompleted && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                        <CheckCircle size={12} /> Tamamlandı
                                    </span>
                                )}
                                {!task.isCompleted && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                        <Clock size={12} /> Bekliyor
                                    </span>
                                )}
                            </div>
                            {task.description && (
                                <div style={{
                                    marginBottom: '12px',
                                    padding: '14px 16px',
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: '10px',
                                    borderLeft: '3px solid #ef4444'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#ef4444', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        🎯 Hedefler
                                    </div>
                                    <p style={{ margin: '0', fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                                        {task.description}
                                    </p>
                                </div>
                            )}
                            {/* Due Date */}
                            {dueDateInfo && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontSize: '13px', fontWeight: '600',
                                    color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#8b5cf6',
                                    background: isOverdue ? 'rgba(239,68,68,0.1)' : isDueSoon ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                                    padding: '4px 10px', borderRadius: '20px'
                                }}>
                                    <Calendar size={13} />
                                    {isOverdue
                                        ? `⚠️ Süre doldu! (${dueDateInfo.formatted})`
                                        : isDueSoon
                                        ? `⏳ ${dueDateInfo.diffDays} gün kaldı (${dueDateInfo.formatted})`
                                        : `Bitiş: ${dueDateInfo.formatted}`}
                                </div>
                            )}
                        </div>
                        {/* Toggle Complete Button */}
                        <button
                            style={{
                                flexShrink: 0,
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '13px',
                                background: task.isCompleted ? 'var(--color-bg-tertiary)' : 'linear-gradient(135deg, #10b981, #059669)',
                                color: task.isCompleted ? 'var(--color-text-secondary)' : '#fff',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={async () => {
                                try {
                                    const newStatus = !task.isCompleted;
                                    const currentNotes = taskNotes[task.id]?.notes ?? task.notes ?? '';
                                    await api.completeTask(task.id, { isCompleted: newStatus, notes: currentNotes, tableData: currentTable });
                                    setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: newStatus } : t));
                                    showToast(newStatus ? '✅ Görev tamamlandı!' : 'Görev durumu güncellendi.');
                                } catch (e) {
                                    showToast('Hata: ' + e.message, 'error');
                                }
                            }}
                        >
                            {task.isCompleted ? 'Geri Al' : '✓ Tamamla'}
                        </button>
                    </div>
                </div>

                {/* Pinned Message */}
                {task.pinnedMessage && (
                    <div style={{
                        margin: '0 20px',
                        marginTop: '16px',
                        padding: '14px 16px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '10px',
                        borderLeft: '3px solid #3b82f6'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#3b82f6', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <MessageSquare size={13} /> Görev Açıklaması
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
                            {task.pinnedMessage}
                        </p>
                    </div>
                )}

                {/* Pinned Link */}
                {task.pinnedLink && (
                    <div style={{
                        margin: '12px 20px',
                        padding: '12px 16px',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '10px',
                        borderLeft: '3px solid #10b981'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#10b981', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <ExternalLink size={13} /> Link
                        </div>
                        <a
                            href={task.pinnedLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#10b981', fontSize: '14px', wordBreak: 'break-all', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {task.pinnedLink} <ExternalLink size={13} />
                        </a>
                    </div>
                )}

                {/* Notes & Table */}
                <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block', color: 'var(--color-text-secondary)' }}>
                            📝 Görev Notum / İlerleme:
                        </label>
                        <textarea
                            className="form-input-modern"
                            rows="3"
                            placeholder="Bu görevle ilgili neler yaptın? Notlarını buraya yaz..."
                            value={taskNotes[task.id]?.notes !== undefined ? taskNotes[task.id].notes : (task.notes || '')}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], notes: val } }));
                            }}
                            onBlur={async () => {
                                try {
                                    const currentNotes = taskNotes[task.id]?.notes;
                                    if (currentNotes !== undefined) {
                                        await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: currentNotes, tableData: currentTable });
                                    }
                                } catch (e) {}
                            }}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Excel Table */}
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block', color: 'var(--color-text-secondary)' }}>
                            📊 Özet Tablosu:
                        </label>
                        <div style={{ overflowX: 'auto', background: 'var(--color-bg-tertiary)', padding: '12px', borderRadius: '10px' }}>
                            <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {currentTable.headers.map((header, hIdx) => (
                                            <th key={hIdx} style={{ padding: '8px', borderBottom: '2px solid var(--color-border)' }}>
                                                <input
                                                    type="text"
                                                    className="form-input-modern"
                                                    style={{ padding: '4px 8px', fontWeight: 'bold', background: 'transparent', border: '1px solid transparent', width: '100%' }}
                                                    value={header}
                                                    placeholder={`Sütun ${hIdx + 1}`}
                                                    onChange={(e) => {
                                                        const newTable = { ...currentTable, headers: [...currentTable.headers] };
                                                        newTable.headers[hIdx] = e.target.value;
                                                        setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                    }}
                                                    onBlur={async () => {
                                                        try {
                                                            const n = taskNotes[task.id]?.notes ?? task.notes;
                                                            await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: n, tableData: currentTable });
                                                        } catch (e) {}
                                                    }}
                                                />
                                            </th>
                                        ))}
                                        <th style={{ padding: '8px', borderBottom: '2px solid var(--color-border)', width: '44px' }}>
                                            <button
                                                title="Sütun Ekle"
                                                className="btn-icon"
                                                onClick={() => {
                                                    const newTable = {
                                                        headers: [...currentTable.headers, `Sütun ${currentTable.headers.length + 1}`],
                                                        rows: currentTable.rows.map(r => [...r, ''])
                                                    };
                                                    setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                }}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTable.rows.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} style={{ padding: '4px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input-modern"
                                                        style={{ padding: '6px', width: '100%' }}
                                                        value={cell}
                                                        onChange={(e) => {
                                                            const newTable = { ...currentTable, rows: [...currentTable.rows] };
                                                            newTable.rows[rIdx] = [...newTable.rows[rIdx]];
                                                            newTable.rows[rIdx][cIdx] = e.target.value;
                                                            setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                                        }}
                                                        onBlur={async () => {
                                                            try {
                                                                const n = taskNotes[task.id]?.notes ?? task.notes;
                                                                await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: n, tableData: currentTable });
                                                            } catch (e) {}
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                            <td></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => {
                                        const newTable = {
                                            ...currentTable,
                                            rows: [...currentTable.rows, new Array(currentTable.headers.length).fill('')]
                                        };
                                        setTaskNotes(prev => ({ ...prev, [task.id]: { ...prev[task.id], tableData: newTable } }));
                                    }}
                                >
                                    + Satır Ekle
                                </button>
                                <button
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'var(--color-bg-tertiary)',
                                        color: 'var(--color-text-primary)',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onClick={async () => {
                                        try {
                                            const n = taskNotes[task.id]?.notes ?? task.notes ?? '';
                                            await api.completeTask(task.id, { isCompleted: task.isCompleted, notes: n, tableData: currentTable });
                                            showToast('✅ Değişiklikler kaydedildi!');
                                        } catch (e) {
                                            showToast('Hata: ' + e.message, 'error');
                                        }
                                    }}
                                >
                                    💾 Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

const MyTasksPage = () => {
    const navigate = useNavigate();
    const [myTasks, setMyTasks] = useState([]);
    const [taskNotes, setTaskNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const tasks = await api.getMyTasks();
                setMyTasks(tasks || []);
            } catch (err) {
                console.warn('Could not fetch tasks:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };


    const pending = myTasks.filter(t => !t.isCompleted);
    const completed = myTasks.filter(t => t.isCompleted);


    return (
        <div className="page">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
                    background: toast.type === 'error' ? '#ef4444' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', padding: '10px 20px', borderRadius: '30px',
                    fontWeight: '700', fontSize: '14px', zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap'
                }}>
                    {toast.message}
                </div>
            )}

            <div className="container" style={{ maxWidth: '800px' }}>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} /> Ana Sayfa
                </button>

                {/* Page Header */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Target size={22} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Ekip Görevlerim</h1>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                {pending.length} bekleyen · {completed.length} tamamlanan
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
                        <div className="loading-spinner-small" style={{ margin: '0 auto 16px' }}></div>
                        Görevler yükleniyor...
                    </div>
                ) : myTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
                        <Target size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Görev Yok</h3>
                        <p style={{ margin: 0 }}>Henüz sana atanmış bir görev bulunmuyor.</p>
                    </div>
                ) : (
                    <>
                        {/* Pending Tasks */}
                        {pending.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                                    <Clock size={18} /> Bekleyen Görevler ({pending.length})
                                </h2>
                                {pending.map(task => <TaskCard key={task.id} task={task} taskNotes={taskNotes} setTaskNotes={setTaskNotes} setMyTasks={setMyTasks} showToast={showToast} />)}
                            </div>
                        )}

                        {/* Completed Tasks */}
                        {completed.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                                    <CheckCircle size={18} /> Tamamlanan Görevler ({completed.length})
                                </h2>
                                {completed.map(task => <TaskCard key={task.id} task={task} taskNotes={taskNotes} setTaskNotes={setTaskNotes} setMyTasks={setMyTasks} showToast={showToast} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyTasksPage;
