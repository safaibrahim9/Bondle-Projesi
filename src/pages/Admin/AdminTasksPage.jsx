import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Clock, Trash2, X, FileText, Calendar, MessageSquare, Link, Pencil } from 'lucide-react';
import api from '../../services/api';

const AdminTasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedToId: '',
        dueDate: '',
        pinnedMessage: '',
        pinnedLink: ''
    });

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        pinnedMessage: '',
        pinnedLink: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, usersData] = await Promise.all([
                api.getAdminTasks(),
                api.getAdminUsers()
            ]);
            setTasks(tasksData || []);
            setUsers(usersData.filter(u => u.team || u.branch) || []);
        } catch (error) {
            console.error('Veri çekme hatası', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assignedToId) {
            alert('Lütfen görev başlığı ve atanacak kişiyi seçin.');
            return;
        }
        try {
            const payload = {
                ...newTask,
                dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
            };
            await api.createAdminTask(payload);
            alert('Görev başarıyla oluşturuldu!');
            setModalOpen(false);
            setNewTask({ title: '', description: '', assignedToId: '', dueDate: '', pinnedMessage: '', pinnedLink: '' });
            fetchData();
        } catch (error) {
            alert('Görev oluşturulurken hata oluştu.');
        }
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            try {
                await api.deleteAdminTask(id);
                fetchData();
            } catch (error) {
                alert('Silme işlemi başarısız.');
            }
        }
    };

    const handleOpenEdit = (task) => {
        setEditingTask(task);
        setEditForm({
            title: task.title || '',
            description: task.description || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            pinnedMessage: task.pinnedMessage || '',
            pinnedLink: task.pinnedLink || ''
        });
        setEditModalOpen(true);
    };

    const handleUpdateTask = async () => {
        if (!editingTask || !editForm.title) {
            alert('Görev başlığı boş olamaz.');
            return;
        }
        try {
            await api.updateAdminTask(editingTask.id, {
                ...editForm,
                dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
            });
            setEditModalOpen(false);
            setEditingTask(null);
            fetchData();
        } catch (error) {
            alert('Güncelleme başarısız: ' + (error.message || ''));
        }
    };

    const handleViewDetails = (task) => {
        setSelectedTask(task);
        setViewModalOpen(true);
    };

    const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="page">
            <div className="container">
                <button
                    onClick={() => navigate('/admin')}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ArrowLeft size={20} />
                    Panele Dön
                </button>

                <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Görev Yönetimi</h1>
                        <p className="text-secondary">Ekip üyelerine görev ata ve takibini yap.</p>
                    </div>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} /> Yeni Görev Ata
                    </button>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>Yükleniyor...</div>
                    ) : tasks.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            Henüz atanmış bir görev bulunmuyor.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {tasks.map((task, index) => (
                                <div key={task.id} className=" admin-list-item" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-md)',
                                    borderBottom: index !== tasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    backgroundColor: task.isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-bg-secondary)'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px' }}>{task.title}</h4>
                                            {task.isCompleted ? (
                                                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={12} /> Tamamlandı
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> Bekliyor
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span style={{ fontSize: '11px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} /> {formatDate(task.dueDate)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                            Atanan: <strong>{task.assignedTo?.name} {task.assignedTo?.surname}</strong>
                                            {task.assignedTo?.branch && ` (${task.assignedTo.branch} - ${task.assignedTo.team})`}
                                        </div>
                                        {(task.pinnedMessage || task.pinnedLink) && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                {task.pinnedMessage && (
                                                    <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <MessageSquare size={11} /> Sabit Mesaj Var
                                                    </span>
                                                )}
                                                {task.pinnedLink && (
                                                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Link size={11} /> Link Var
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleViewDetails(task)}
                                            className="btn btn-sm btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <FileText size={14} /> Detaylar
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(task)}
                                            className="btn btn-sm btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6', borderColor: '#8b5cf6' }}
                                        >
                                            <Pencil size={14} /> Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="btn btn-sm btn-ghost"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Yeni Görev Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content glass-card poster-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '95%', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <div className="modal-header">
                            <h2>Yeni Görev Ata</h2>
                            <button className="btn-icon" onClick={() => setModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label>Görev Başlığı *</label>
                                <input
                                    type="text"
                                    className="form-input-modern"
                                    placeholder="Görev adı..."
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Kime Atanacak? (Sadece ekibi olanlar) *</label>
                                <select
                                    className="form-input-modern"
                                    value={newTask.assignedToId}
                                    onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} {u.surname} ({u.branch} - {u.team})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hedefler (İsteğe bağlı)</label>
                                <textarea
                                    className="form-input-modern"
                                    placeholder="Görev detayı..."
                                    rows="3"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>

                            {/* Bitiş Tarihi */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> Bitiş Tarihi (İsteğe bağlı)
                                </label>
                                <input
                                    type="date"
                                    className="form-input-modern"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                            </div>

                            {/* Sabit Mesaj */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MessageSquare size={14} /> Görev Açıklaması (Sabit Mesaj)
                                </label>
                                <textarea
                                    className="form-input-modern"
                                    placeholder="Kişiye iletmek istediğiniz kalıcı bir not veya talimat..."
                                    rows="3"
                                    value={newTask.pinnedMessage}
                                    onChange={(e) => setNewTask({ ...newTask, pinnedMessage: e.target.value })}
                                />
                                <small style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                                    Bu mesaj kullanıcının görev sayfasında her zaman gösterilir.
                                </small>
                            </div>

                            {/* Sabit Link */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Link size={14} /> Sabit Link (Her zaman görünür)
                                </label>
                                <input
                                    type="url"
                                    className="form-input-modern"
                                    placeholder="https://..."
                                    value={newTask.pinnedLink}
                                    onChange={(e) => setNewTask({ ...newTask, pinnedLink: e.target.value })}
                                />
                                <small style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                                    Görev formları, dökümanlar veya kaynaklar için bir bağlantı ekleyin.
                                </small>
                            </div>

                            <button onClick={handleCreateTask} className="btn btn-primary" style={{ marginTop: '8px' }}>
                                Görevi Ata
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detay Modal */}
            {viewModalOpen && selectedTask && (
                <div className="modal-overlay" onClick={() => setViewModalOpen(false)}>
                    <div className="modal-content glass-card poster-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <div className="modal-header">
                            <h2>Görev Detayı: {selectedTask.title}</h2>
                            <button className="btn-icon" onClick={() => setViewModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {selectedTask.dueDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', color: '#8b5cf6', fontSize: '14px', fontWeight: '600' }}>
                                    <Calendar size={16} /> Bitiş Tarihi: {formatDate(selectedTask.dueDate)}
                                </div>
                            )}

                            {selectedTask.pinnedMessage && (
                                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#3b82f6', fontWeight: '700', fontSize: '13px' }}>
                                        <MessageSquare size={14} /> Sabit Mesaj
                                    </div>
                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px' }}>{selectedTask.pinnedMessage}</p>
                                </div>
                            )}

                            {selectedTask.pinnedLink && (
                                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                                        <Link size={14} /> Sabit Link
                                    </div>
                                    <a href={selectedTask.pinnedLink} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', wordBreak: 'break-all', fontSize: '14px' }}>
                                        {selectedTask.pinnedLink}
                                    </a>
                                </div>
                            )}

                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Kullanıcının Notu:</h4>
                                <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', minHeight: '60px' }}>
                                    {selectedTask.notes || <span style={{ color: 'var(--color-text-tertiary)' }}>Henüz not eklenmemiş.</span>}
                                </div>
                            </div>
                            
                            {selectedTask.tableData && (
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Tablo (Excel) Verisi:</h4>
                                    <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                                            <thead>
                                                <tr>
                                                    {(() => {
                                                        const data = selectedTask.tableData;
                                                        if (Array.isArray(data)) {
                                                            return (
                                                                <>
                                                                    <th style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>Sütun 1</th>
                                                                    <th style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>Sütun 2</th>
                                                                    <th style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>Sütun 3</th>
                                                                </>
                                                            );
                                                        }
                                                        return data?.headers?.map((h, i) => (
                                                            <th key={i} style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                                                        ));
                                                    })()}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const data = selectedTask.tableData;
                                                    if (Array.isArray(data)) {
                                                        return data.map((row, i) => (
                                                            <tr key={i}>
                                                                <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>{row.col1}</td>
                                                                <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>{row.col2}</td>
                                                                <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>{row.col3}</td>
                                                            </tr>
                                                        ));
                                                    }
                                                    return data?.rows?.map((row, i) => (
                                                        <tr key={i}>
                                                            {row.map((cell, j) => (
                                                                <td key={j} style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Görev Düzenleme Modal */}
            {editModalOpen && editingTask && (
                <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
                    <div className="modal-content glass-card poster-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '95%', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Pencil size={18} /> Görevi Düzenle
                            </h2>
                            <button className="btn-icon" onClick={() => setEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', fontSize: '13px', color: '#8b5cf6', fontWeight: '600' }}>
                                Atanan: {editingTask.assignedTo?.name} {editingTask.assignedTo?.surname}
                            </div>
                            <div className="form-group">
                                <label>Görev Başlığı *</label>
                                <input
                                    type="text"
                                    className="form-input-modern"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Hedefler</label>
                                <textarea
                                    className="form-input-modern"
                                    rows="3"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> Bitiş Tarihi
                                </label>
                                <input
                                    type="date"
                                    className="form-input-modern"
                                    value={editForm.dueDate}
                                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MessageSquare size={14} /> Görev Açıklaması
                                </label>
                                <textarea
                                    className="form-input-modern"
                                    rows="3"
                                    placeholder="Kişiye iletmek istediğiniz kalıcı bir not..."
                                    value={editForm.pinnedMessage}
                                    onChange={(e) => setEditForm({ ...editForm, pinnedMessage: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Link size={14} /> Sabit Link
                                </label>
                                <input
                                    type="url"
                                    className="form-input-modern"
                                    placeholder="https://..."
                                    value={editForm.pinnedLink}
                                    onChange={(e) => setEditForm({ ...editForm, pinnedLink: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleUpdateTask} className="btn btn-primary" style={{ flex: 1 }}>
                                    Kaydet
                                </button>
                                <button onClick={() => setEditModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                                    İptal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTasksPage;
