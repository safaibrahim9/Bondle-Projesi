import React from 'react';
import { X, Shield, FileText, Lock } from 'lucide-react';
import './LegalModal.css';

const LegalModal = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const renderContent = () => {
        switch (type) {
            case 'kvkk':
                return (
                    <div className="legal-content">
                        <h2>KVKK Aydınlatma Metni</h2>
                        <div className="legal-icon"><Shield size={32} color="#10b981" /></div>
                        <p><strong>1. Veri Sorumlusu:</strong> Bondle olarak, kişisel verilerinizin güvenliğine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla kişisel verilerinizi işlemekteyiz.</p>
                        
                        <p><strong>2. İşlenen Kişisel Verileriniz ve İşlenme Amacı:</strong><br/>
                        Uygulamamıza kayıt olurken ve kullanırken paylaştığınız <em>Ad, Soyad, E-posta, İlgi Alanları, Konum (Şehir) ve Profil Fotoğrafı</em> gibi kişisel verileriniz;<br/>
                        - Size uygun etkinlikler, kulüpler ve eşleşmeler önermek (Yapay Zeka destekli),<br/>
                        - Platform içi iletişimi sağlamak,<br/>
                        - Hizmetlerimizi geliştirmek ve güvenliğinizi sağlamak amacıyla işlenmektedir.</p>

                        <p><strong>3. Kişisel Verilerin Aktarılması:</strong><br/>
                        Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir üçüncü taraf şirketle reklam veya pazarlama amacıyla paylaşılmamaktadır. Verileriniz yalnızca sunucu altyapımızı sağlayan güvenli servis sağlayıcılarımız (örn: AWS, Vercel vb.) üzerinde şifreli olarak tutulur.</p>

                        <p><strong>4. KVKK Madde 11 Kapsamındaki Haklarınız:</strong><br/>
                        Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, eksik/yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz. Taleplerinizi uygulama içi destek kanalımızdan iletebilirsiniz.</p>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="legal-content">
                        <h2>Gizlilik Politikası</h2>
                        <div className="legal-icon"><Lock size={32} color="#f59e0b" /></div>
                        <p><strong>1. Bilgilerinizin Korunması:</strong> Bondle, kullanıcılarının gizliliğini korumayı taahhüt eder. Şifreleriniz modern kriptografik yöntemlerle şifrelenir ve veri tabanımızda düz metin olarak asla tutulmaz.</p>
                        
                        <p><strong>2. Diğer Kullanıcılarla Paylaşılan Bilgiler:</strong><br/>
                        Profilinizde belirttiğiniz adınız, biyografiniz, ilgi alanlarınız ve profil fotoğrafınız, ağ kurma (networking) amacına uygun olarak diğer Bondle kullanıcıları tarafından görüntülenebilir. E-posta adresiniz ve şifreniz daima gizli tutulur.</p>

                        <p><strong>3. Çerezler ve Analitik (Cookies):</strong><br/>
                        Uygulama deneyiminizi iyileştirmek için temel çerezleri (oturum yönetimi, dil tercihleri) kullanırız. Bondle, kullanım alışkanlıklarınızı izleyip dış firmalara satan agresif takip sistemleri kullanmaz.</p>

                        <p><strong>4. Hesabın Silinmesi:</strong><br/>
                        İstediğiniz zaman hesap ayarlarınızdan hesabınızı kalıcı olarak silebilirsiniz. Hesabınızı sildiğinizde, yasal olarak tutmakla yükümlü olduğumuz veriler hariç, profilinize ve etkileşimlerinize ait tüm kişisel veriler sistemlerimizden anonimleştirilir veya tamamen silinir.</p>
                    </div>
                );
            case 'terms':
            default:
                return (
                    <div className="legal-content">
                        <h2>Kullanım Şartları</h2>
                        <div className="legal-icon"><FileText size={32} color="#3b82f6" /></div>
                        <p><strong>1. Kabul ve Değişiklikler:</strong> Bondle uygulamasına üye olarak bu Kullanım Şartları'nı kabul etmiş sayılırsınız. Bondle, bu şartları önceden bildirimde bulunarak güncelleme hakkını saklı tutar.</p>
                        
                        <p><strong>2. Yaş Sınırı:</strong> Platformumuzu kullanabilmek için en az 18 yaşında (veya yasal erginlik yaşında) olmanız gerekmektedir. Etkinliklere katılım için yaş beyanınız esas alınır.</p>

                        <p><strong>3. Topluluk Kuralları ve Davranış:</strong><br/>
                        Bondle bir "Profesyonel ve Sosyal Ağ" platformudur. Kullanıcılar:<br/>
                        - Diğer kullanıcılara karşı saygılı olmak zorundadır.<br/>
                        - Zorbalık, taciz, nefret söylemi veya ayrımcılık içeren içerikler paylaşamaz.<br/>
                        - Platformu spam, dolandırıcılık veya izinsiz ticari amaçlar için kullanamaz.<br/>
                        Bu kuralların ihlali durumunda Bondle, önceden haber vermeksizin hesabınızı askıya alma veya kalıcı olarak silme hakkına sahiptir.</p>

                        <p><strong>4. Fikri Mülkiyet:</strong> Uygulamanın yazılımı, tasarımı, algoritmaları ve tüm içerikleri Bondle'a aittir, kopyalanamaz veya çoğaltılamaz.</p>
                    </div>
                );
        }
    };

    return (
        <div className="modal-overlay legal-modal-overlay">
            <div className="modal-content legal-modal-container">
                <button className="legal-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>
                <div className="legal-modal-body">
                    {renderContent()}
                </div>
                <div className="legal-modal-footer">
                    <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                        Okudum, Anladım
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
