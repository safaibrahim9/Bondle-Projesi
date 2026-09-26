import React from 'react';

const PaymentVerificationPage = () => (
    <div className="page">
        <div className="container">
            <h1>Ödeme Doğrulama</h1>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-xl)' }}>
                "Ödeme Yaptım" butonuna tıklayan kullanıcıların listesi.
            </p>
            <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                        <strong>Ahmet Yılmaz</strong>
                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
                            AI & Yapay Zeka Geleceği - ₺299
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--color-success)', color: 'white' }}>Onayla</button>
                        <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: 'white' }}>Reddet</button>
                    </div>
                </div>
                <a href="https://www.shopier.com/BondleX" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    Shopier'i Kontrol Et
                </a>
            </div>
            <p className="text-tertiary" style={{ fontSize: 'var(--font-size-sm)' }}>
                Demo: Gerçek uygulamada Shopier API entegrasyonu yapılır
            </p>
        </div>
    </div>
);

export default PaymentVerificationPage;
