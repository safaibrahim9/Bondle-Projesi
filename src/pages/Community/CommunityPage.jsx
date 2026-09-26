import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { 
    Image as ImageIcon, 
    Send, 
    Trash2,
    Edit2,
    MoreVertical, 
    Heart, 
    MessageCircle, 
    X,
    Loader2,
    Calendar,
    Users
} from 'lucide-react';
import UserProfileModal from '../../components/UserProfileModal';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { compressImage } from '../../utils/imageCompression';
import './CommunityPage.css';

const CommunityPage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        document.title = 'Bondle | Topluluk';
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const data = await api.getCommunityFeed();
            setPosts(data);
        } catch (err) {
            console.error('Failed to fetch feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !selectedImage) return;

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('content', content);
            if (selectedImage) {
                // Compress image before sending to backend
                const compressedImage = await compressImage(selectedImage, { quality: 0.6 });
                formData.append('file', compressedImage);
                console.log(`Original size: ${(selectedImage.size / 1024).toFixed(2)} KB, Compressed size: ${(compressedImage.size / 1024).toFixed(2)} KB`);
            }
            
            await api.createCommunityPost(formData);
            
            // Reset form
            setContent('');
            handleRemoveImage();
            
            // Refresh feed
            fetchFeed();
        } catch (err) {
            console.error('Failed to create post:', err);
            alert(`Paylaşım yapılırken bir hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleLike = async (postId) => {
        try {
            const result = await api.togglePostLike(postId);
            setPosts(posts.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        hasLiked: result.liked,
                        likeCount: result.liked ? p.likeCount + 1 : p.likeCount - 1
                    };
                }
                return p;
            }));
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Bu paylaşımı silmek istediğinize emin misiniz?')) return;
        
        try {
            await api.deleteCommunityPost(postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err) {
            console.error('Failed to delete post:', err);
            alert('Paylaşım silinirken bir hata oluştu.');
        }
    };

    const handleUpdatePost = async (postId, newContent) => {
        try {
            await api.updateCommunityPost(postId, newContent);
            setPosts(posts.map(p => {
                if (p.id === postId) {
                    return { ...p, content: newContent };
                }
                return p;
            }));
            return true;
        } catch (err) {
            console.error('Failed to update post:', err);
            alert('Paylaşım güncellenirken bir hata oluştu.');
            return false;
        }
    };

    const renderPost = (post) => {
        return (
            <PostItem 
                key={post.id} 
                post={post} 
                currentUser={user}
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
                onLike={handleToggleLike}
                onProfileClick={setSelectedUser}
            />
        );
    };

    return (
        <div className="community-page">
            <div className="community-header">
                <h1 className="mentorship-title" style={{ fontSize: '2.5rem', margin: 0, marginBottom: 'var(--spacing-xs)' }}>Topluluk Akışı</h1>
                <p className="text-secondary">Bondle'de neler olup bitiyor? Bir an paylaş!</p>
            </div>

            {/* Create Post Section */}
            <div className="create-post-card">
                <div className="create-post-input-wrapper">
                    <UserAvatar user={user} size="md" />
                    <textarea 
                        className="create-post-textarea"
                        placeholder="Neler oluyor? Bir an paylaş..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {imagePreview && (
                    <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <button className="remove-image-btn" onClick={handleRemoveImage}>
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="create-post-actions">
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <button 
                            className="image-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                        >
                            <ImageIcon size={20} color="var(--color-primary)" />
                            <span>Fotoğraf Ekle</span>
                        </button>
                    </div>

                    <button 
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!content.trim() && !selectedImage)}
                        style={{ padding: '8px 24px', borderRadius: 'var(--radius-lg)' }}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Paylaş'}
                    </button>
                </div>
            </div>

            {/* Feed Section */}
            <div className="community-feed">
                {loading && posts.length === 0 ? (
                    <div className="feed-loading">
                        <Loader2 className="animate-spin" size={32} />
                        <p>Akış yükleniyor...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center" style={{ padding: '40px', color: 'var(--color-text-tertiary)' }}>
                        Henüz hiç paylaşım yapılmamış. İlk anı sen paylaş!
                    </div>
                ) : (
                    posts.map(renderPost)
                )}
            </div>

            <UserProfileModal 
                isOpen={!!selectedUser} 
                onClose={() => setSelectedUser(null)} 
                user={selectedUser}
            />
        </div>
    );
};

const PostItem = ({ post, currentUser, onDelete, onUpdate, onLike, onProfileClick }) => {
    const [showComments, setShowComments] = useState(false);
    const [showLikers, setShowLikers] = useState(false);
    const [likers, setLikers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showHeartAnim, setShowHeartAnim] = useState(false);

    const handleDoubleClick = () => {
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
        if (!post.hasLiked) {
            onLike(post.id);
        }
    };

    const handleShowLikers = async () => {
        if (currentUser?.id === post.userId) {
            try {
                const data = await api.getPostLikes(post.id);
                setLikers(data);
                setShowLikers(true);
            } catch (err) {
                console.error('Failed to fetch likers:', err);
            }
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim() || editContent === post.content) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        const success = await onUpdate(post.id, editContent);
        if (success) {
            setIsEditing(false);
        }
        setIsUpdating(false);
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="post-user-info" onClick={() => onProfileClick(post.user)} style={{ cursor: 'pointer' }}>
                    <UserAvatar user={post.user} size="md" />
                    <div className="post-meta">
                        <span className="post-user-name">{post.user.name} {post.user.surname}</span>
                        <span className="post-time">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {post.club && (
                        <div className="post-tag tag-club">
                            <Users size={10} style={{ marginRight: '4px' }} />
                            {post.club.name}
                        </div>
                    )}
                    {currentUser?.id === post.userId && (
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="post-action-btn"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    {(currentUser?.id === post.userId || currentUser?.role === 'admin') && (
                        <button 
                            onClick={() => onDelete(post.id)}
                            className="post-action-btn"
                            style={{ color: 'var(--color-error)' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="post-content">
                {isEditing ? (
                    <div className="edit-post-wrapper">
                        <textarea 
                            className="edit-post-textarea"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                        />
                        <div className="edit-post-actions">
                            <button 
                                className="btn-ghost btn-sm" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(post.content);
                                }}
                                disabled={isUpdating}
                            >
                                İptal
                            </button>
                            <button 
                                className="btn-primary btn-sm" 
                                onClick={handleUpdate}
                                disabled={isUpdating || !editContent.trim()}
                            >
                                {isUpdating ? 'Güncelleniyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                ) : (
                    post.content
                )}
            </div>

            {post.imageUrl && (
                <div className="post-image-wrapper" onDoubleClick={handleDoubleClick}>
                    <img src={post.imageUrl} alt="Post" className="post-image" loading="lazy" />
                    {showHeartAnim && (
                        <div className="heart-animation-overlay">
                            <Heart size={80} fill="rgba(255, 255, 255, 0.9)" color="transparent" />
                        </div>
                    )}
                </div>
            )}

            {post.likeCount > 0 && (
                <div style={{ padding: '0 16px', marginTop: '12px', marginBottom: '-4px' }}>
                    <span 
                        onClick={handleShowLikers}
                        style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: 'var(--color-text-primary)' }}
                    >
                        {post.likeCount} kişi beğendi
                    </span>
                </div>
            )}

            <div className="post-footer">
                <button 
                    className={`post-action ${post.hasLiked ? 'liked' : ''}`}
                    onClick={() => onLike(post.id)}
                    style={{ color: post.hasLiked ? 'var(--color-error)' : '' }}
                >
                    <Heart size={20} fill={post.hasLiked ? 'currentColor' : 'none'} />
                    <span>Beğen</span>
                </button>
                <button className="post-action" onClick={() => setShowComments(!showComments)}>
                    <MessageCircle size={20} />
                    <span>{post.commentCount > 0 ? `${post.commentCount} Yorum` : 'Yorum Yap'}</span>
                </button>
            </div>

            {showComments && (
                <CommentSection postId={post.id} currentUser={currentUser} onProfileClick={onProfileClick} />
            )}

            {showLikers && (
                <LikersModal likers={likers} onClose={() => setShowLikers(false)} />
            )}
        </div>
    );
};

const CommentSection = ({ postId, currentUser, onProfileClick }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const data = await api.getPostComments(postId);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            const savedComment = await api.addPostComment(postId, newComment);
            setComments([...comments, { ...savedComment, user: currentUser }]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleLike = async (commentId) => {
        try {
            const result = await api.toggleCommentLike(commentId);
            setComments(comments.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        hasLiked: result.liked,
                        likeCount: result.liked ? (c.likeCount || 0) + 1 : (c.likeCount || 0) - 1
                    };
                }
                return c;
            }));
        } catch (err) {
            console.error('Failed to toggle comment like:', err);
        }
    };

    return (
        <div className="comment-section" style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-subtle-border)', background: 'var(--color-bg-secondary)' }}>
            <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                {loading ? (
                    <p className="text-center text-secondary" style={{ fontSize: '12px' }}>Yorumlar yükleniyor...</p>
                ) : comments.length === 0 ? (
                    <p className="text-center text-secondary" style={{ fontSize: '12px' }}>Henüz yorum yapılmamış.</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                            <div onClick={() => onProfileClick(comment.user)} style={{ cursor: 'pointer' }}>
                                <UserAvatar user={comment.user} size="sm" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ flex: 1, background: 'var(--color-subtle-bg)', padding: '8px 12px', borderRadius: 'var(--radius-lg)' }}>
                                        <span 
                                            style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '2px', cursor: 'pointer' }}
                                            onClick={() => onProfileClick(comment.user)}
                                        >
                                            {comment.user.name} {comment.user.surname}
                                        </span>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{comment.content}</p>
                                    </div>
                                    <button 
                                        className={`comment-like-btn ${comment.hasLiked ? 'liked' : ''}`}
                                        onClick={() => handleToggleLike(comment.id)}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            color: comment.hasLiked ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '2px'
                                        }}
                                    >
                                        <Heart size={14} fill={comment.hasLiked ? 'currentColor' : 'none'} />
                                        {comment.likeCount > 0 && <span style={{ fontSize: '10px' }}>{comment.likeCount}</span>}
                                    </button>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginLeft: '4px', marginTop: '4px', display: 'inline-block' }}>
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                    type="text" 
                    placeholder="Yorum yaz..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ flex: 1, background: 'var(--color-bg-primary)', border: '1px solid var(--color-subtle-border)', borderRadius: 'var(--radius-full)', padding: '8px 16px', color: 'var(--color-text-primary)', fontSize: '13px' }}
                />
                <button 
                    type="submit" 
                    disabled={isSubmitting || !newComment.trim()}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

const LikersModal = ({ likers, onClose }) => {
    return (
        <div className="badge-detail-modal-overlay" onClick={onClose}>
            <div className="badge-detail-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '320px' }}>
                <div className="badge-detail-header" style={{ padding: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-primary)' }}>Beğenenler</h3>
                    <button className="badge-detail-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="badge-detail-content" style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {likers.map(like => (
                            <div key={like.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'var(--color-subtle-bg)', borderRadius: 'var(--radius-lg)' }}>
                                <UserAvatar user={like.user} size="sm" />
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{like.user.name} {like.user.surname}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;



