import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import './AuthPages.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        bio: '',
        city: 'İstanbul',
        interests: [],
        referralCode: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const interestOptions = [
        'Technology', 'AI', 'Design', 'Marketing', 'Business',
        'Startups', 'Investment', 'Psychology', 'Career Development'
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleInterestToggle = (interest) => {
        const newInterests = formData.interests.includes(interest)
            ? formData.interests.filter((i) => i !== interest)
            : [...formData.interests, interest];

        setFormData({ ...formData, interests: newInterests });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.interests.length === 0) {
            setError('Lütfen en az bir ilgi alanı seçin');
            return;
        }

        setLoading(true);
        const result = await register(formData);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Kayıt başarısız');
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo" style={{ width: '100%', marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'center' }}>
                        <img 
                            src="/assets/bondle-logo.png" 
                            alt="Bondle" 
                            style={{ height: '80px', width: 'auto', objectFit: 'contain' }} 
                        />
                    </div>
                    <h1>Bondle'e Katıl</h1>
                    <p className="text-secondary">Hesap oluştur ve başla</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Ad Soyad</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Adınız Soyadınız"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">E-posta</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Şifre</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength={7}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="referralCode">Davet Kodu (Opsiyonel)</label>
                        <input
                            id="referralCode"
                            name="referralCode"
                            type="text"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Örn: BONDLE-XXXXX"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="city">Şehir</label>
                        <select
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                        >
                            <option value="İstanbul">İstanbul</option>
                            <option value="Ankara">Ankara</option>
                            <option value="İzmir">İzmir</option>
                            <option value="Bursa">Bursa</option>
                            <option value="Antalya">Antalya</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Hakkında (Opsiyonel)</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Kendinizden kısaca bahsedin..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>İlgi Alanları</label>
                        <div className="interest-options">
                            {interestOptions.map((interest) => (
                                <button
                                    key={interest}
                                    type="button"
                                    className={`interest-option ${formData.interests.includes(interest) ? 'active' : ''
                                        }`}
                                    onClick={() => handleInterestToggle(interest)}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        <UserPlus size={20} />
                        {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="text-secondary">
                        Zaten hesabınız var mı?{' '}
                        <Link to="/login" className="text-accent">
                            Giriş Yap
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
