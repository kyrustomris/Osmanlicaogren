// premium.js
document.addEventListener('DOMContentLoaded', () => {
    // Premium giriş işlemleri
    const premiumLoginBtn = document.getElementById('premiumLoginBtn');
    if (premiumLoginBtn) {
        premiumLoginBtn.addEventListener('click', () => {
            const password = document.getElementById('premiumPassword').value;
            // Demo şifre kontrolü
            if (password === '1234567890') {
                localStorage.setItem('osmanlicaPremium', 'true');
                alert('Premium üyeliğiniz başarıyla aktif edildi!');
                window.location.reload();
            } else {
                alert('Geçersiz şifre! Deneme şifresi: 1234567890');
            }
        });
    }

    // Tema değiştirme
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.body.className = `${btn.dataset.theme}-theme`;
            localStorage.setItem('osmanlicaTheme', btn.dataset.theme);
        });
    });

    // Sayfa yüklendiğinde temayı ayarla
    const savedTheme = localStorage.getItem('osmanlicaTheme') || 'light';
    document.body.className = `${savedTheme}-theme`;
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
});