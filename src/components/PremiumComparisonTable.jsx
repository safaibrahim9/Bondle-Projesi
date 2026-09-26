import React from 'react';
import { Check, X } from 'lucide-react';
import './PremiumComparisonTable.css';

const PremiumComparisonTable = ({ isClub = false }) => {
    const individualFeatures = [
        { feature: 'Yapay Zeka (AI) Kariyer Koçu', free: 'Günlük 1 Kullanım', premium: 'Sınırsız Kullanım' },
        { feature: 'Networking & Eşleşme', free: 'Ayda 5 Eşleşme', premium: 'Sınırsız + 3 Süper Mesaj' },
        { feature: 'Etkinlik & Workshop Kayıtları', free: 'Standart Sıra', premium: '24 Saat Erken + Öncelik' },
        { feature: 'Circle & Quiz Etkinlikleri', free: 'Ücretli', premium: 'Ücretsiz' },
        { feature: 'Eğitim, Workshop & Konuşma Kulübü', free: 'Standart Sıra', premium: '%10-20 İndirim' },
        { feature: 'Proje Ortağı Bulma', free: 'Yok', premium: 'Var' },
    ];

    const clubFeatures = [
        { feature: 'Etkinlik Görünürlüğü', free: 'Normal', premium: 'Öne Çıkan' },
        { feature: 'Analitik Dashboard', free: false, premium: true },
        { feature: 'Kulüpler Arası Network', free: 'Sınırlı (2/ay)', premium: 'Sınırsız' },
        { feature: 'Üye Yönetim Araçları', free: 'Temel', premium: 'Gelişmiş' },
        { feature: 'Özel Etkinlik Badge', free: false, premium: true },
        { feature: 'Detaylı Raporlama', free: false, premium: true },
    ];

    const features = isClub ? clubFeatures : individualFeatures;
    const freePrice = '0 TL';
    const premiumPriceMonthly = isClub ? 'Ücretsiz' : '₺149,99/ay';
    const premiumPriceYearly = isClub ? 'Ücretsiz' : '₺1.199,99/yıl';

    const renderCell = (value) => {
        if (typeof value === 'boolean') {
            return value ? (
                <Check size={20} color="var(--color-success)" />
            ) : (
                <X size={20} color="var(--color-error)" style={{ opacity: 0.5 }} />
            );
        }
        return value;
    };

    return (
        <div className="comparison-table-container">
            <table className="comparison-table">
                <thead>
                    <tr>
                        <th className="feature-col">Özellik</th>
                        <th className="plan-col normal">Free</th>
                        <th className="plan-col premium">Premium</th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((item, idx) => (
                        <tr key={idx}>
                            <td className="feature-name">{item.feature}</td>
                            <td className="plan-value normal">{renderCell(item.free)}</td>
                            <td className="plan-value premium">{renderCell(item.premium)}</td>
                        </tr>
                    ))}
                    <tr className="price-row">
                        <td className="feature-name"><strong>Fiyat (Aylık)</strong></td>
                        <td className="plan-value normal"><strong>{freePrice}</strong></td>
                        <td className="plan-value premium"><strong>{premiumPriceMonthly}</strong></td>
                    </tr>
                    <tr className="price-row">
                        <td className="feature-name"><strong>Fiyat (Yıllık)</strong></td>
                        <td className="plan-value normal"><strong>{freePrice}</strong></td>
                        <td className="plan-value premium" style={{ color: '#34A853' }}><strong>{premiumPriceYearly}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default PremiumComparisonTable;

