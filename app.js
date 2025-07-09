// Firebase başlatma
const firebaseConfig = {
  apiKey: "AIzaSyBB-PEtapGv0S6B_Xt1A-6dTMjvO5ASrNc",
  authDomain: "osmanlicaogren-57ff0.firebaseapp.com",
  projectId: "osmanlicaogren-57ff0",
  storageBucket: "osmanlicaogren-57ff0.firebasestorage.app",
  messagingSenderId: "55078200434",
  appId: "1:55078200434:web:f933fe5178daaf63210eeb",
  measurementId: "G-58MD9BL1TY"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            startQuizBtn: document.getElementById('startQuizBtn'),
            quizModal: document.getElementById('quizModal'),
            quizQuestion: document.getElementById('quizQuestion'),
            quizOptions: document.getElementById('quizOptions'),
            quizScore: document.getElementById('quizScore'),
            nextQuestionBtn: document.getElementById('nextQuestionBtn'),
            endQuizBtn: document.getElementById('endQuizBtn')
        };

        this.kelimeListeleri = {};
        this.aktifListeAdi = null;
        this.suankiKelimeIndex = 0;
        this.filteredKelimeler = [];
        this.premium = false;

        // Quiz değişkenleri
        this.quizWords = [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        this.quizTotal = 0;

        this.config = {
            freeWordLimit: 100,
            premiumPassword: "123456" // Gerçek uygulamada bu şekilde saklamayın
        };

        this.init();
    }

    async init() {
        this.temaYukle();
        this.initAuth();
        this.eventListenerlariAyarla();
        this.initQuiz();
    }

    initAuth() {
        auth.onAuthStateChanged(user => {
            window.currentUser = user;
            this.firebaseReady();
            this.updateAuthUI();
        });
    }

    updateAuthUI() {
        const isLoggedIn = !!window.currentUser;
        this.elements.premiumLoginForm.classList.toggle('d-none', isLoggedIn);
        this.elements.premiumInfo.classList.toggle('d-none', !isLoggedIn);
        this.elements.premiumBadge.classList.toggle('d-none', !isLoggedIn || !this.premium);
    }

    async login() {
        const password = this.elements.premiumPassword.value;
        try {
            if (password === this.config.premiumPassword) {
                this.premium = true;
                this.elements.premiumModal.hide();
                this.updateAuthUI();
                this.showAlert("Premium erişim aktif!", "success");
            } else {
                throw new Error("Geçersiz şifre");
            }
        } catch (error) {
            this.showAlert(`Giriş başarısız: ${error.message}`, "danger");
        }
    }

    logout() {
        this.premium = false;
        this.updateAuthUI();
        this.showAlert("Çıkış yapıldı", "info");
    }

    async firebaseReady() {
        if (window.currentUser) {
            await this.loadUserPremium();
            await this.firestoreListeleriYukle();
        } else {
            this.kelimeListeleri = {};
            this.aktifListeAdi = null;
            this.listeButonlariniGuncelle();
            this.kelimeGoster();
            this.premium = false;
        }
    }

    async loadUserPremium() {
        if (!window.currentUser) return;
        const userDoc = await db.collection("users").doc(window.currentUser.uid).get();
        this.premium = userDoc.exists && userDoc.data().premium;
        this.updateAuthUI();
    }

    async firestoreListeleriYukle() {
        const user = window.currentUser;
        if (!user) return;
        
        try {
            const snapshot = await db.collection("users").doc(user.uid).collection("kelimeListeleri").get();
            this.kelimeListeleri = {};
            snapshot.forEach(doc => {
                this.kelimeListeleri[doc.id] = doc.data().kelimeler || [];
            });
            this.aktifListeAdi = Object.keys(this.kelimeListeleri)[0] || null;
            this.listeButonlariniGuncelle();
            this.kelimeGoster();
        } catch (error) {
            console.error("Liste yükleme hatası:", error);
            this.showAlert("Listeler yüklenirken hata oluştu", "danger");
        }
    }

    async firestoreListeKaydet(listeAdi) {
        const user = window.currentUser;
        if (!user) return;
        
        try {
            const kelimeler = this.kelimeListeleri[listeAdi] || [];
            await db.collection("users").doc(user.uid).collection("kelimeListeleri").doc(listeAdi).set({ kelimeler });
        } catch (error) {
            console.error("Liste kaydetme hatası:", error);
            this.showAlert("Liste kaydedilirken hata oluştu", "danger");
        }
    }

    async firestoreListeSil(listeAdi) {
        const user = window.currentUser;
        if (!user) return;
        
        try {
            await db.collection("users").doc(user.uid).collection("kelimeListeleri").doc(listeAdi).delete();
        } catch (error) {
            console.error("Liste silme hatası:", error);
            this.showAlert("Liste silinirken hata oluştu", "danger");
        }
    }

    temaYukle() {
        const savedTheme = localStorage.getItem('osmanlicaTheme') || 'light';
        this.temaDegistir(savedTheme);
        this.elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === savedTheme);
        });
    }

    temaDegistir(theme) {
        document.body.className = theme + '-theme';
        localStorage.setItem('osmanlicaTheme', theme);
        this.elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    listeButonlariniGuncelle() {
        this.elements.listeButonlari.innerHTML = '';
        Object.keys(this.kelimeListeleri).forEach(listeAdi => {
            const btn = document.createElement('button');
            btn.className = `btn btn-sm ${listeAdi === this.aktifListeAdi ? 'btn-primary' : 'btn-outline-secondary'}`;
            btn.textContent = listeAdi;
            btn.addEventListener('click', () => this.aktifListeDegistir(listeAdi));
            this.elements.listeButonlari.appendChild(btn);
        });
    }

    aktifListeDegistir(listeAdi) {
        this.aktifListeAdi = listeAdi;
        this.suankiKelimeIndex = 0;
        this.filteredKelimeler = [];
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

    async jsonDosyasiniIsle(file, mevcutListeyeEkle) {
        if (this.checkWordLimit()) {
            this.elements.premiumModal.show();
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const yeniKelimeler = JSON.parse(e.target.result);
                if (!Array.isArray(yeniKelimeler)) throw new Error("Geçersiz JSON formatı");

                const gecerliKelimeler = yeniKelimeler.filter(k => k?.word && k?.meaning);
                if (!gecerliKelimeler.length) throw new Error("Geçerli kelime bulunamadı");

                let listeAdi = this.aktifListeAdi;
                if (!mevcutListeyeEkle || !listeAdi) {
                    listeAdi = file.name.replace('.json', '') || 'Yeni Liste';
                    this.kelimeListeleri[listeAdi] = gecerliKelimeler;
                    this.aktifListeAdi = listeAdi;
                } else {
                    this.kelimeListeleri[listeAdi] = [
                        ...(this.kelimeListeleri[listeAdi] || []),
                        ...gecerliKelimeler
                    ];
                }

                await this.firestoreListeKaydet(listeAdi);
                this.listeButonlariniGuncelle();
                this.kelimeGoster();

                this.showAlert(`${gecerliKelimeler.length} kelime başarıyla yüklendi!`, 'success');

            } catch (error) {
                console.error("JSON işleme hatası:", error);
                this.showAlert(`Hata: ${error.message}`, 'danger');
            }
        };
        reader.readAsText(file);
    }

    checkWordLimit() {
        if (this.premium) return false;
        const limitAsildi = this.getTotalWordCount() >= this.config.freeWordLimit;
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

    // QUIZ FONKSİYONLARI
    initQuiz() {
        this.elements.startQuizBtn?.addEventListener('click', () => this.startQuiz());
        this.elements.nextQuestionBtn?.addEventListener('click', () => this.nextQuestion());
        this.elements.endQuizBtn?.addEventListener('click', () => this.closeQuiz());
    }

    startQuiz() {
        const kelimeler = this.aktifKelimeler();
        if (kelimeler.length < 4) {
            this.showAlert('Quiz için en az 4 kelime olmalı!', 'warning');
            return;
        }
        
        this.quizWords = this.shuffleArray([...kelimeler]);
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        this.quizTotal = Math.min(this.quizWords.length, 10);
        this.showQuizModal();
        this.showQuizQuestion();
    }

    showQuizModal() {
        this.elements.quizModal.style.display = 'block';
        this.elements.nextQuestionBtn.style.display = 'none';
        this.elements.endQuizBtn.style.display = 'none';
        this.elements.quizScore.textContent = '';
    }

    showQuizQuestion() {
        if (this.currentQuizIndex >= this.quizTotal) {
            this.elements.quizQuestion.textContent = "Quiz Bitti!";
            this.elements.quizOptions.innerHTML = "";
            this.elements.quizScore.textContent = `Doğru: ${this.quizScore}/${this.quizTotal}`;
            this.elements.endQuizBtn.style.display = 'block';
            return;
        }

        const currentWord = this.quizWords[this.currentQuizIndex];
        const correct = currentWord.meaning;
        let options = [correct];
        
        while (options.length < 4) {
            const wrong = this.quizWords[Math.floor(Math.random() * this.quizWords.length)].meaning;
            if (!options.includes(wrong)) options.push(wrong);
        }
        
        options = this.shuffleArray(options);

        this.elements.quizQuestion.textContent = `"${currentWord.word}" (${currentWord.transliteration}) kelimesinin Türkçesi nedir?`;
        this.elements.quizOptions.innerHTML = options.map(opt => 
            `<button class="quiz-option btn btn-outline-primary w-100 my-1">${opt}</button>`
        ).join('');

        Array.from(this.elements.quizOptions.getElementsByClassName('quiz-option')).forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.textContent === correct) {
                    this.quizScore++;
                    btn.classList.remove('btn-outline-primary');
                    btn.classList.add('btn-success');
                } else {
                    btn.classList.remove('btn-outline-primary');
                    btn.classList.add('btn-danger');
                }
                
                Array.from(this.elements.quizOptions.getElementsByClassName('quiz-option')).forEach(b => {
                    b.disabled = true;
                });
                
                this.elements.nextQuestionBtn.style.display = 'inline-block';
            });
        });
    }

    nextQuestion() {
        this.currentQuizIndex++;
        this.showQuizQuestion();
        this.elements.nextQuestionBtn.style.display = 'none';
    }

    closeQuiz() {
        this.elements.quizModal.style.display = 'none';
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    eventListenerlariAyarla() {
        // Temalar
        this.elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.temaDegistir(btn.dataset.theme));
        });

        // Kelime navigasyon
        this.elements.oncekiKelimeBtn.addEventListener('click', () => this.oncekiKelime());
        this.elements.sonrakiKelimeBtn.addEventListener('click', () => this.sonrakiKelime());
        this.elements.rastgeleKelimeBtn.addEventListener('click', () => this.rastgeleKelime());

        // Öğrenme butonları
        this.elements.bilmiyorumBtn.addEventListener('click', () => {
            this.showAlert("Bu kelimeyi tekrar gözden geçirelim!", "info");
            this.sonrakiKelime();
        });

        this.elements.biliyorumBtn.addEventListener('click', () => {
            this.showAlert("Harika! Bu kelimeyi biliyorsunuz 🎉", "success");
            this.sonrakiKelime();
        });

        // Liste yönetimi
        this.elements.yeniListeEkleBtn.addEventListener('click', async () => {
            const listeAdi = prompt("Yeni liste adı girin:");
            if (!listeAdi) return;

            if (this.kelimeListeleri[listeAdi]) {
                this.showAlert("Bu isimde liste zaten var!", "warning");
                return;
            }

            this.kelimeListeleri[listeAdi] = [];
            this.aktifListeAdi = listeAdi;
            await this.firestoreListeKaydet(listeAdi);
            this.listeButonlariniGuncelle();
            this.kelimeGoster();
        });

        this.elements.listeyiSilBtn.addEventListener('click', async () => {
            if (!this.aktifListeAdi) return;
            if (confirm(`"${this.aktifListeAdi}" listesini silmek istediğinize emin misiniz?`)) {
                await this.firestoreListeSil(this.aktifListeAdi);
                delete this.kelimeListeleri[this.aktifListeAdi];
                this.aktifListeAdi = Object.keys(this.kelimeListeleri)[0] || null;
                this.listeButonlariniGuncelle();
                this.kelimeGoster();
            }
        });

        // JSON import
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

        // Arama
        this.elements.searchButton.addEventListener('click', () => this.kelimeAra());
        this.elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.kelimeAra();
        });

        // Premium
        this.elements.premiumLoginBtn.addEventListener('click', () => this.login());
        this.elements.premiumLogoutBtn.addEventListener('click', () => this.logout());
    }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    window.osmanlicaApp = new OsmanlicaUygulamasi();
});
