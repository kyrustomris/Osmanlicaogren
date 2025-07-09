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
            searchButton: document.getElementById('searchButton')
        };

        this.kelimeListeleri = {};
        this.aktifListeAdi = null;
        this.suankiKelimeIndex = 0;
        this.filteredKelimeler = [];
        this.premium = false;
        this.firebaseReadyCalled = false;

        this.config = {
            freeWordLimit: 100
        };

        this.init();
    }

    async init() {
        this.temaYukle();
        this.eventListenerlariAyarla();
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
    }

    async firestoreListeleriYukle() {
        const user = window.currentUser;
        if (!user) return;
        const snapshot = await db.collection("users").doc(user.uid).collection("kelimeListeleri").get();
        this.kelimeListeleri = {};
        snapshot.forEach(doc => {
            this.kelimeListeleri[doc.id] = doc.data().kelimeler || [];
        });
        this.aktifListeAdi = Object.keys(this.kelimeListeleri)[0] || null;
        this.listeButonlariniGuncelle();
        this.kelimeGoster();
    }

    async firestoreListeKaydet(listeAdi) {
        const user = window.currentUser;
        if (!user) return;
        const kelimeler = this.kelimeListeleri[listeAdi] || [];
        await db.collection("users").doc(user.uid).collection("kelimeListeleri").doc(listeAdi).set({ kelimeler });
    }

    async firestoreListeSil(listeAdi) {
        const user = window.currentUser;
        if (!user) return;
        await db.collection("users").doc(user.uid).collection("kelimeListeleri").doc(listeAdi).delete();
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
            this.showAlert("Harika! Bu kelimeyi biliyorsunuz 🎉", "success");
            this.sonrakiKelime();
        });

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

        this.elements.searchButton.addEventListener('click', () => this.kelimeAra());
        this.elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.kelimeAra();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.osmanlicaApp = new OsmanlicaUygulamasi();
});

// === QUIZ MODÜLÜ ===
let quizWords = [];
let currentQuizIndex = 0;
let quizScore = 0;
let quizTotal = 0;

function closeQuizModal() {
    document.getElementById('quizModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (!startQuizBtn) return;

    startQuizBtn.onclick = function() {
        const app = window.osmanlicaApp;
        const kelimeler = app.aktifKelimeler();
        if (!kelimeler || kelimeler.length < 4) {
            alert('Quiz için en az 4 kelime olmalı!');
            return;
        }
        quizWords = shuffleArray([...kelimeler]);
        currentQuizIndex = 0;
        quizScore = 0;
        quizTotal = Math.min(quizWords.length, 10);
        showQuizModal();
        showQuizQuestion();
    };

    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    if (nextQuestionBtn) nextQuestionBtn.onclick = function() {
        currentQuizIndex++;
        showQuizQuestion();
        this.style.display = 'none';
    };
    const endQuizBtn = document.getElementById('endQuizBtn');
    if (endQuizBtn) endQuizBtn.onclick = closeQuizModal;
});

function showQuizModal() {
    document.getElementById('quizModal').style.display = 'block';
    document.getElementById('nextQuestionBtn').style.display = 'none';
    document.getElementById('endQuizBtn').style.display = 'none';
    document.getElementById('quizScore').innerText = '';
}

function showQuizQuestion() {
    if (currentQuizIndex >= quizTotal) {
        document.getElementById('quizQuestion').innerText = "Quiz Bitti!";
        document.getElementById('quizOptions').innerHTML = "";
        document.getElementById('quizScore').innerText = "Doğru: " + quizScore + "/" + quizTotal;
        document.getElementById('endQuizBtn').style.display = 'block';
        return;
    }
    const currentWord = quizWords[currentQuizIndex];
    const correct = currentWord.meaning;
    let options = [correct];
    while (options.length < 4) {
        const wrong = quizWords[Math.floor(Math.random() * quizWords.length)].meaning;
        if (!options.includes(wrong)) options.push(wrong);
    }
    options = shuffleArray(options);

    document.getElementById('quizQuestion').innerText = `"${currentWord.word}" (${currentWord.transliteration}) kelimesinin Türkçesi nedir?`;
    document.getElementById('quizOptions').innerHTML = options.map(opt => 
        `<button class="quiz-option btn btn-outline-primary w-100 my-1">${opt}</button>`
    ).join('');

    Array.from(document.getElementsByClassName('quiz-option')).forEach(btn => {
        btn.onclick = function() {
            if (btn.innerText === correct) {
                quizScore++;
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-success');
            } else {
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-danger');
            }
            Array.from(document.getElementsByClassName('quiz-option')).forEach(b => b.disabled = true);
            document.getElementById('nextQuestionBtn').style.display = 'inline-block';
        }
    });
}
function sendEmail() {
  const params = {
    email: "alici@example.com",
    message: "Bu bir test mesajıdır!",
  };

  emailjs.send("service_1avrv0q", "template_pc99ct6", params)
    .then(() => alert("E-posta gönderildi!"))
    .catch((error) => alert("Hata: " + error));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
