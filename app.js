class OsmanlicaUygulamasi {
    constructor() {
        this.elements = {
            osmanlicaKelime: document.getElementById('osmanlicaKelime'),
            transliteration: document.getElementById('transliteration'),
            meaning: document.getElementById('meaning'),
            kelimeSayaci: document.querySelector('.counter-text'),
            oncekiKelimeBtn: document.getElementById('oncekiKelimeBtn'),
            sonrakiKelimeBtn: document.getElementById('sonrakiKelimeBtn'),
            rastgeleKelimeBtn: document.getElementById('rastgeleKelimeBtn'),
            bilmiyorumBtn: document.getElementById('bilmiyorumBtn'),
            biliyorumBtn: document.getElementById('biliyorumBtn'),
            listeButonlari: document.getElementById('listeButonlari'),
            yeniListeEkleBtn: document.getElementById('yeniListeEkleBtn'),
            listeyiSilBtn: document.getElementById('listeyiSilBtn'),
            jsonFileInput: document.getElementById('jsonFileInput'),
            mevcutListeyeEkleBtn: document.getElementById('mevcutListeyeEkleBtn'),
            yeniListeOlusturBtn: document.getElementById('yeniListeOlusturBtn'),
            themeButtons: document.querySelectorAll('.theme-btn'),
            premiumBtn: document.getElementById('premiumBtn'),
            premiumModal: new bootstrap.Modal(document.getElementById('premiumModal')),
            premiumPassword: document.getElementById('premiumPassword'),
            premiumLoginBtn: document.getElementById('premiumLoginBtn'),
            premiumLogoutBtn: document.getElementById('premiumLogoutBtn'),
            premiumLoginForm: document.getElementById('premiumLoginForm'),
            premiumInfo: document.getElementById('premiumInfo'),
            premiumBadge: document.getElementById('premiumBadge'),
            wordLimitAlert: document.getElementById('wordLimitAlert'),
            premiumStatusAlert: document.getElementById('premiumStatusAlert'),
            // Arama fonksiyonu için yeni elementler
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton')
        };

        this.kelimeListeleri = {};
        this.aktifListeAdi = null;
        this.suankiKelimeIndex = 0;
        this.filteredKelimeler = []; // Filtrelenmiş kelimeler için
        this.userStats = {
            learnedWords: 0,
            quizSuccess: 0,
            hatStudies: 0
        };
        
        this.config = {
            premiumPassword: "1234567890",
            freeWordLimit: 100,
            trialPeriodDays: 7,
            contact: {
                whatsappNumber: "905309082276",
                supportEmail: "ozzasci@gmail.com",
                companyName: "Osmanlıca Öğren"
            },
            pricing: {
                monthly: 29.99,
                yearly: 299.99
            }
        };
        
        this.init();
    }

    kullaniciVerileriniYukle() {
        const kayitliVeriler = localStorage.getItem('userStats');
        if (kayitliVeriler) {
            try {
                this.userStats = JSON.parse(kayitliVeriler);
            } catch (error) {
                console.error("Kullanıcı verileri yükleme hatası:", error);
                this.userStats = {
                    learnedWords: 0,
                    quizSuccess: 0,
                    hatStudies: 0
                };
            }
        }
    }

    init() {
        this.temaYukle();
        this.premiumYukle();
        this.listeleriYukle();
        this.kullaniciVerileriniYukle();
        this.eventListenerlariAyarla();
        this.kelimeGoster();
    }

    temaYukle() {
        const savedTheme = localStorage.getItem('osmanlicaTheme') || 'light';
        this.temaDegistir(savedTheme);
        this.elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === savedTheme);
        });
    }

    temaDegistir(theme) {
        document.body.className = `${theme}-theme`;
        localStorage.setItem('osmanlicaTheme', theme);
    }

    premiumYukle() {
        const premiumStatus = this.getPremiumStatus();
        if (premiumStatus.isActive) {
            this.elements.premiumBadge.classList.remove('d-none');
            this.elements.premiumLoginForm.classList.add('d-none');
            this.elements.premiumInfo.classList.remove('d-none');
        }
    }

    getPremiumStatus() {
        const isPremium = localStorage.getItem('osmanlicaPremium') === 'true';
        if (!isPremium) return { isActive: false };
        
        const trialEndDate = localStorage.getItem('trialEndDate');
        if (trialEndDate) {
            const now = new Date();
            const endDate = new Date(trialEndDate);
            return {
                isActive: now <= endDate,
                isTrial: true,
                remainingDays: Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
            };
        }
        return { isActive: true, isTrial: false };
    }

    listeleriYukle() {
        const kayitliListeler = localStorage.getItem('osmanlicaKelimeListeleri');
        if (kayitliListeler) {
            try {
                this.kelimeListeleri = JSON.parse(kayitliListeler);
                this.listeButonlariniGuncelle();
                
                const aktifListe = localStorage.getItem('aktifOsmanlicaListe');
                if (aktifListe && this.kelimeListeleri[aktifListe]) {
                    this.aktifListeDegistir(aktifListe);
                }
            } catch (error) {
                console.error("Liste yükleme hatası:", error);
                this.listeleriSifirla();
            }
        }
    }

    listeButonlariniGuncelle() {
        this.elements.listeButonlari.innerHTML = '';
        Object.keys(this.kelimeListeleri).forEach(listeAdi => {
            const btn = document.createElement('button');
            btn.className = `btn btn-sm ${listeAdi === this.aktifListeAdi ? 'btn-primary' : 'btn-outline-secondary'}`;
            btn.textContent = listeAdi;
            btn.onclick = () => this.aktifListeDegistir(listeAdi);
            this.elements.listeButonlari.appendChild(btn);
        });
    }

    listeleriSifirla() {
        this.kelimeListeleri = {};
        this.aktifListeAdi = null;
        localStorage.removeItem('osmanlicaKelimeListeleri');
        localStorage.removeItem('aktifOsmanlicaListe');
        this.listeButonlariniGuncelle();
        this.kelimeGoster();
    }

    aktifListeDegistir(listeAdi) {
        this.aktifListeAdi = listeAdi;
        this.suankiKelimeIndex = 0;
        this.filteredKelimeler = []; // Liste değiştiğinde filtreyi temizle
        localStorage.setItem('aktifOsmanlicaListe', listeAdi);
        this.listeButonlariniGuncelle();
        this.kelimeGoster();
    }

    aktifKelimeler() {
        return this.filteredKelimeler.length > 0 ? 
            this.filteredKelimeler : 
            (this.aktifListeAdi ? this.kelimeListeleri[this.aktifListeAdi] || [] : []);
    }

    kelimeGoster(isFiltered = false) {
        const kelimeler = isFiltered ? this.filteredKelimeler : this.aktifKelimeler();
        
        if (kelimeler.length === 0) {
            this.elements.osmanlicaKelime.textContent = "---";
            this.elements.transliteration.textContent = "---";
            this.elements.meaning.textContent = isFiltered ? "Sonuç bulunamadı" : (this.aktifListeAdi ? "Liste boş" : "Liste yükleyin");
            this.guncelleKelimeSayaci();
            return;
        }
        
        const kelime = kelimeler[this.suankiKelimeIndex];
        
        [this.elements.osmanlicaKelime, this.elements.transliteration, this.elements.meaning]
            .forEach(el => el.style.opacity = 0);
        
        setTimeout(() => {
            this.elements.osmanlicaKelime.textContent = kelime.word || "---";
            this.elements.transliteration.textContent = kelime.transliteration || "---";
            this.elements.meaning.textContent = kelime.meaning || "---";
            
            [this.elements.osmanlicaKelime, this.elements.transliteration, this.elements.meaning]
                .forEach(el => el.style.opacity = 1);
            
            this.guncelleKelimeSayaci();
        }, 200);
    }

    guncelleKelimeSayaci() {
        const kelimeler = this.aktifKelimeler();
        this.elements.kelimeSayaci.textContent = 
            `${kelimeler.length ? this.suankiKelimeIndex + 1 : 0}/${kelimeler.length}`;
    }

    oncekiKelime() {
        const kelimeler = this.aktifKelimeler();
        if (!kelimeler.length) return;
        this.suankiKelimeIndex = (this.suankiKelimeIndex - 1 + kelimeler.length) % kelimeler.length;
        this.kelimeGoster(this.filteredKelimeler.length > 0);
    }

    sonrakiKelime() {
        const kelimeler = this.aktifKelimeler();
        if (!kelimeler.length) return;
        this.suankiKelimeIndex = (this.suankiKelimeIndex + 1) % kelimeler.length;
        this.kelimeGoster(this.filteredKelimeler.length > 0);
    }

    rastgeleKelime() {
        const kelimeler = this.aktifKelimeler();
        if (kelimeler.length < 2) return;
        
        let yeniIndex;
        do {
            yeniIndex = Math.floor(Math.random() * kelimeler.length);
        } while (yeniIndex === this.suankiKelimeIndex);
        
        this.suankiKelimeIndex = yeniIndex;
        this.kelimeGoster(this.filteredKelimeler.length > 0);
    }

    // Yeni eklenen arama fonksiyonu
    kelimeAra() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        if (!searchTerm) {
            this.filteredKelimeler = [];
            this.suankiKelimeIndex = 0;
            this.kelimeGoster();
            return;
        }

        const kelimeler = this.aktifListeAdi ? this.kelimeListeleri[this.aktifListeAdi] || [] : [];
        this.filteredKelimeler = kelimeler.filter(kelime => 
            (kelime.word && kelime.word.toLowerCase().includes(searchTerm)) || 
            (kelime.transliteration && kelime.transliteration.toLowerCase().includes(searchTerm)) || 
            (kelime.meaning && kelime.meaning.toLowerCase().includes(searchTerm))
        );

        if (this.filteredKelimeler.length > 0) {
            this.suankiKelimeIndex = 0;
            this.kelimeGoster(true);
        } else {
            this.showAlert("Aranan kelime bulunamadı", "warning");
        }
    }

    jsonDosyasiniIsle(file, mevcutListeyeEkle) {
        if (this.checkWordLimit()) {
            this.elements.premiumModal.show();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const yeniKelimeler = JSON.parse(e.target.result);
                if (!Array.isArray(yeniKelimeler)) throw new Error("Geçersiz JSON formatı");

                const gecerliKelimeler = yeniKelimeler.filter(k => k?.word && k?.meaning);
                if (!gecerliKelimeler.length) throw new Error("Geçerli kelime bulunamadı");

                if (!mevcutListeyeEkle || !this.aktifListeAdi) {
                    const listeAdi = file.name.replace('.json', '') || 'Yeni Liste';
                    this.kelimeListeleri[listeAdi] = gecerliKelimeler;
                    this.aktifListeDegistir(listeAdi);
                } else {
                    this.kelimeListeleri[this.aktifListeAdi] = [
                        ...(this.kelimeListeleri[this.aktifListeAdi] || []),
                        ...gecerliKelimeler
                    ];
                    this.aktifListeDegistir(this.aktifListeAdi);
                }
                
                localStorage.setItem('osmanlicaKelimeListeleri', JSON.stringify(this.kelimeListeleri));
                this.showAlert(`${gecerliKelimeler.length} kelime başarıyla yüklendi!`, 'success');
                
            } catch (error) {
                console.error("JSON işleme hatası:", error);
                this.showAlert(`Hata: ${error.message}`, 'danger');
            }
        };
        reader.readAsText(file);
    }

    checkWordLimit() {
        const limitAsildi = !this.getPremiumStatus().isActive && 
                           this.getTotalWordCount() >= this.config.freeWordLimit;
        this.elements.wordLimitAlert?.classList.toggle('d-none', !limitAsildi);
        return limitAsildi;
    }

    getTotalWordCount() {
        return Object.values(this.kelimeListeleri).reduce((sum, liste) => sum + liste.length, 0);
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `${message}<button class="btn-close" data-bs-dismiss="alert"></button>`;
        document.querySelector('.container').prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    eventListenerlariAyarla() {
        this.elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.temaDegistir(btn.dataset.theme));
        });

        this.elements.oncekiKelimeBtn.addEventListener('click', () => this.oncekiKelime());
        this.elements.sonrakiKelimeBtn.addEventListener('click', () => this.sonrakiKelime());
        this.elements.rastgeleKelimeBtn.addEventListener('click', () => this.rastgeleKelime());

        this.elements.bilmiyorumBtn.addEventListener('click', () => {
            this.showAlert("Bu kelimeyi tekrar gözden geçirelim!", "info");
            this.sonrakiKelime();
        });

        this.elements.biliyorumBtn.addEventListener('click', () => {
            this.userStats.learnedWords++;
            localStorage.setItem('userStats', JSON.stringify(this.userStats));
            this.showAlert("Harika! Bu kelimeyi biliyorsunuz 🎉", "success");
            this.sonrakiKelime();
        });

        this.elements.yeniListeEkleBtn.addEventListener('click', () => {
            const listeAdi = prompt("Yeni liste adı girin:");
            if (!listeAdi) return;
            
            if (this.kelimeListeleri[listeAdi]) {
                this.showAlert("Bu isimde liste zaten var!", "warning");
                return;
            }
            
            this.kelimeListeleri[listeAdi] = [];
            this.aktifListeDegistir(listeAdi);
        });

        this.elements.listeyiSilBtn.addEventListener('click', () => {
            if (!this.aktifListeAdi) return;
            if (confirm(`"${this.aktifListeAdi}" listesini silmek istediğinize emin misiniz?`)) {
                delete this.kelimeListeleri[this.aktifListeAdi];
                this.aktifListeAdi = Object.keys(this.kelimeListeleri)[0] || null;
                localStorage.setItem('osmanlicaKelimeListeleri', JSON.stringify(this.kelimeListeleri));
                this.listeButonlariniGuncelle();
                this.kelimeGoster();
            }
        });

        this.elements.mevcutListeyeEkleBtn.addEventListener('click', () => {
            if (!this.elements.jsonFileInput.files[0]) {
                this.showAlert("Lütfen JSON dosyası seçin!", "warning");
                return;
            }
            this.jsonDosyasiniIsle(this.elements.jsonFileInput.files[0], true);
        });

        this.elements.yeniListeOlusturBtn.addEventListener('click', () => {
            if (!this.elements.jsonFileInput.files[0]) {
                this.showAlert("Lütfen JSON dosyası seçin!", "warning");
                return;
            }
            this.jsonDosyasiniIsle(this.elements.jsonFileInput.files[0], false);
        });

        this.elements.premiumLoginBtn.addEventListener('click', () => {
            const password = this.elements.premiumPassword.value;
            if (password === this.config.premiumPassword) {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + this.config.trialPeriodDays);
                
                localStorage.setItem('osmanlicaPremium', 'true');
                localStorage.setItem('trialEndDate', trialEnd.toISOString());
                
                this.elements.premiumBadge.classList.remove('d-none');
                this.elements.premiumLoginForm.classList.add('d-none');
                this.elements.premiumInfo.classList.remove('d-none');
                this.elements.premiumModal.hide();
                
                this.showAlert(`7 günlük deneme başladı! Bitiş: ${trialEnd.toLocaleDateString()}`, 'success');
            } else {
                this.showAlert("Geçersiz şifre! Deneme şifresi: 1234567890", "danger");
            }
        });

        this.elements.premiumLogoutBtn.addEventListener('click', () => {
            if (confirm("Premium üyeliği sonlandırmak istediğinize emin misiniz?")) {
                localStorage.removeItem('osmanlicaPremium');
                localStorage.removeItem('trialEndDate');
                this.elements.premiumBadge.classList.add('d-none');
                this.elements.premiumLoginForm.classList.remove('d-none');
                this.elements.premiumInfo.classList.add('d-none');
                this.showAlert("Premium üyeliğiniz sonlandırıldı", "info");
            }
        });

        // Arama fonksiyonu için event listener'lar
        this.elements.searchButton.addEventListener('click', () => this.kelimeAra());
        this.elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.kelimeAra();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OsmanlicaUygulamasi();
});