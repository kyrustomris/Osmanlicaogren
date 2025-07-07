/***********************
 *  OSMANLICA QUIZ + OYUNLAŞTIRMA + GÖREVLER + BAŞARILAR (TEK DOSYA)
 ***********************/

// --- Parametreler, Rozetler ve Görevler ---
const XP_PER_CORRECT = 50;
const LEVEL_XP_BASE = 100;
const LEVEL_XP_GROWTH = 1.2;

const BADGES = [
    { id: "ilk-quiz", title: "İlk Quiz", desc: "İlk quizini tamamla", icon: "assets/badges/ilk-quiz.svg" },
    { id: "streak-3gun", title: "3 Günlük Seri", desc: "3 gün üst üste quiz çöz", icon: "assets/badges/streak-3gun.svg" },
    { id: "100dogru", title: "100 Doğru", desc: "Toplamda 100 doğru cevap", icon: "assets/badges/100dogru.svg" },
    { id: "hafta-quiz", title: "Haftalık Quizci", desc: "Bir haftada 5 gün quiz çöz", icon: "assets/badges/hafta-quiz.svg" },
    { id: "ilk10quiz", title: "Quiz Ustası", desc: "İlk 10 quizini tamamla", icon: "assets/badges/ilk10quiz.svg" }
];

const DAILY_MISSIONS = [
    { id: "dogru5", title: "Bugün 5 Doğru Cevap", desc: "Bir günde 5 doğru cevap ver.", reward: { xp: 50 } },
    { id: "quiz3", title: "3 Quiz Çöz", desc: "Bugün 3 farklı quiz tamamla.", reward: { xp: 100 } },
    { id: "hatasiz", title: "Hatasız Quiz", desc: "Quizde hiç yanlış yapmadan tamamla.", reward: { xp: 70 } }
];

// --- Kullanıcı Profil Tanımı ---
function getInitialProfile() {
    return {
        username: '',
        level: 1,
        xp: 0,
        dailyStreak: 0,
        lastQuizDate: null,
        last7Days: [],
        badges: [],
        totalCorrect: 0,
        totalWrong: 0,
        totalQuiz: 0,
        missions: [],
        lastMissionDate: null,
        correctToday: 0,
        quizCountToday: 0,
        achievements: []
    };
}

function saveProfile(profile) {
    localStorage.setItem('osmanlicaUserProfile', JSON.stringify(profile));
}

function loadProfile() {
    let profile = JSON.parse(localStorage.getItem('osmanlicaUserProfile')) || getInitialProfile();
    if (!profile.username) {
        profile.username = prompt("Kullanıcı adınızı girin (puan tablosunda gözükecek):", "misafir") || "misafir";
        saveProfile(profile);
    }
    return profile;
}

var userProfile = loadProfile();

// --- Seviye Hesabı ---
function calculateLevel(xp) {
    let level = 1;
    let requiredXP = LEVEL_XP_BASE;
    let curXP = xp;
    while (curXP >= requiredXP) {
        curXP -= requiredXP;
        level++;
        requiredXP = Math.floor(requiredXP * LEVEL_XP_GROWTH);
    }
    return { level, currentXP: curXP, nextLevelXP: requiredXP };
}

// --- UI Elementleri ---
const elements = {
    questionText: document.getElementById('questionText'),
    questionTypeBadge: document.getElementById('questionTypeBadge'),
    osmanlicaPreview: document.getElementById('osmanlicaPreview'),
    answerButtons: document.getElementById('answerButtons'),
    writtenQuestion: document.getElementById('writtenQuestion'),
    writtenQuestionType: document.getElementById('writtenQuestionType'),
    osmanlicaWrittenPreview: document.getElementById('osmanlicaWrittenPreview'),
    writtenAnswer: document.getElementById('writtenAnswer'),
    answerFeedback: document.getElementById('answerFeedback'),
    checkAnswerBtn: document.getElementById('checkAnswerBtn'),
    resultCard: document.getElementById('resultCard'),
    scoreText: document.getElementById('scoreText'),
    quizProgress: document.getElementById('quizProgress'),
    progressText: document.getElementById('progressText'),
    testModuBtn: document.getElementById('testModuBtn'),
    yaziliModuBtn: document.getElementById('yaziliModuBtn'),
    testModu: document.getElementById('testModu'),
    yaziliModu: document.getElementById('yaziliModu')
};

// --- Quiz Akışı ---
let quizData = [];
let currentQuestion = 0;
let score = 0;
let quizMode = 'test';
let usedQuestionIndices = [];
let userAnswers = [];

// Quiz başlat
function startQuiz() {
    const savedLists = localStorage.getItem('osmanlicaKelimeListeleri');
    if (savedLists) {
        const allLists = JSON.parse(savedLists);
        quizData = Object.values(allLists).flat();
        if (quizData.length < 4) {
            alert('Quiz yapmak için en az 4 kelime ekleyin!');
            window.location.href = 'index.html';
            return;
        }
        shuffleQuestions();
        loadQuestion();
    } else {
        alert('Quiz yapmak için önce ana sayfadan kelime ekleyin!');
        window.location.href = 'index.html';
    }
}

// Soruları karıştır
function shuffleQuestions() {
    usedQuestionIndices = [];
    userAnswers = [];
    const questionCount = Math.min(10, quizData.length);
    while (usedQuestionIndices.length < questionCount) {
        const randomIndex = Math.floor(Math.random() * quizData.length);
        if (!usedQuestionIndices.includes(randomIndex)) {
            usedQuestionIndices.push(randomIndex);
        }
    }
    currentQuestion = 0;
    score = 0;
    updateProgress();
}

// Soru yükle
function loadQuestion() {
    if (currentQuestion >= usedQuestionIndices.length) {
        showResults();
        return;
    }
    const questionIndex = usedQuestionIndices[currentQuestion];
    const question = quizData[questionIndex];

    if (quizMode === 'test') {
        elements.testModu.style.display = 'block';
        elements.yaziliModu.style.display = 'none';
        if (Math.random() > 0.5) {
            elements.questionTypeBadge.textContent = "Anlam";
            elements.questionText.textContent = "Aşağıdaki kelimenin anlamı nedir?";
            elements.osmanlicaPreview.textContent = question.word;
            const correctAnswer = question.meaning;
            const answers = [correctAnswer, ...getRandomAnswers(correctAnswer, 'meaning')];
            elements.answerButtons.innerHTML = '';
            shuffleArray(answers).forEach(answer => {
                const button = document.createElement('button');
                button.className = 'btn btn-outline-primary answer-btn py-2';
                button.innerHTML = `<i class="bi bi-question-circle"></i> ${answer}`;
                button.addEventListener('click', () => checkAnswer(answer, correctAnswer, question));
                elements.answerButtons.appendChild(button);
            });
        } else {
            elements.questionTypeBadge.textContent = "Kelime";
            elements.questionText.textContent = `"${question.meaning}" anlamına gelen kelime hangisidir?`;
            elements.osmanlicaPreview.textContent = "";
            const correctAnswer = question.word;
            const answers = [correctAnswer, ...getRandomAnswers(correctAnswer, 'word')];
            elements.answerButtons.innerHTML = '';
            shuffleArray(answers).forEach(answer => {
                const button = document.createElement('button');
                button.className = 'btn btn-outline-primary answer-btn py-2';
                button.innerHTML = `<i class="bi bi-translate"></i> ${answer}`;
                button.addEventListener('click', () => checkAnswer(answer, correctAnswer, question));
                elements.answerButtons.appendChild(button);
            });
        }
    } else {
        elements.testModu.style.display = 'none';
        elements.yaziliModu.style.display = 'block';
        if (Math.random() > 0.5) {
            elements.writtenQuestionType.textContent = "Anlam";
            elements.writtenQuestion.textContent = "Aşağıdaki kelimenin anlamı nedir?";
            elements.osmanlicaWrittenPreview.textContent = question.word;
            elements.writtenAnswer.placeholder = "Anlamını yazın...";
            elements.writtenAnswer.dataset.correctAnswer = question.meaning;
            elements.writtenAnswer.dataset.questionType = "meaning";
        } else {
            elements.writtenQuestionType.textContent = "Okunuş";
            elements.writtenQuestion.textContent = "Aşağıdaki kelimenin okunuşu nedir?";
            elements.osmanlicaWrittenPreview.textContent = question.word;
            elements.writtenAnswer.placeholder = "Okunuşunu yazın...";
            elements.writtenAnswer.dataset.correctAnswer = question.transliteration;
            elements.writtenAnswer.dataset.questionType = "transliteration";
        }
        elements.writtenAnswer.value = '';
        elements.answerFeedback.textContent = '';
        elements.writtenAnswer.dataset.questionIndex = questionIndex;
    }
}

// Rastgele yanlış cevaplar al
function getRandomAnswers(correctAnswer, field) {
    let wrongs = [];
    while (wrongs.length < 3) {
        const random = quizData[Math.floor(Math.random() * quizData.length)];
        const randomAnswer = random[field];
        if (randomAnswer !== correctAnswer && !wrongs.includes(randomAnswer)) {
            wrongs.push(randomAnswer);
        }
    }
    return wrongs;
}

// Dizi karıştırma
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Cevap kontrolü (test modu)
function checkAnswer(selectedAnswer, correctAnswer, question) {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent.includes(correctAnswer)) {
            button.classList.add('correct');
            button.innerHTML = `<i class="bi bi-check-circle"></i> ${button.textContent.replace('bi-question-circle', 'bi-check-circle')}`;
        } else if (button.textContent.includes(selectedAnswer)) {
            button.classList.add('incorrect');
            button.innerHTML = `<i class="bi bi-x-circle"></i> ${button.textContent.replace('bi-question-circle', 'bi-x-circle')}`;
        }
    });
    const isCorrect = selectedAnswer === correctAnswer;
    if (isCorrect) score++;
    userAnswers.push({
        question,
        userAnswer: selectedAnswer,
        isCorrect,
        questionType: elements.questionTypeBadge.textContent.toLowerCase()
    });
    setTimeout(() => {
        currentQuestion++;
        updateProgress();
        loadQuestion();
    }, 1200);
}

// Yazılı cevap kontrolü
elements.checkAnswerBtn.addEventListener('click', () => {
    const correctAnswer = elements.writtenAnswer.dataset.correctAnswer ? elements.writtenAnswer.dataset.correctAnswer.toLowerCase() : "";
    const userAnswer = elements.writtenAnswer.value.trim().toLowerCase();
    const questionIndex = elements.writtenAnswer.dataset.questionIndex;
    const questionType = elements.writtenAnswer.dataset.questionType;
    const question = quizData[questionIndex];
    if (!userAnswer) {
        alert('Lütfen bir cevap yazın!');
        return;
    }
    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) {
        elements.answerFeedback.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle"></i> ✅ Doğru Cevap!</div>';
        score++;
    } else {
        elements.answerFeedback.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle"></i> ❌ Yanlış Cevap! 
                <div class="mt-2">Doğru cevap: <strong>${correctAnswer}</strong></div>
            </div>
        `;
    }
    userAnswers.push({
        question,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect,
        questionType
    });
    setTimeout(() => {
        currentQuestion++;
        updateProgress();
        loadQuestion();
    }, 1500);
});

// --- Günlük Görevler Kontrolü ---
function getMissionStatus(profile) {
    const today = (new Date()).toISOString().slice(0,10);
    if (!profile.missions) profile.missions = [];
    return DAILY_MISSIONS.map(m => {
        const done = profile.missions.find(x => x.id === m.id && x.date === today);
        return { ...m, completed: !!done };
    });
}
function checkDailyMissions(profile, todayStats) {
    const today = (new Date()).toISOString().slice(0,10);
    if (!profile.missions) profile.missions = [];
    if (todayStats.correctToday >= 5) completeMission(profile, "dogru5");
    if (todayStats.quizCountToday >= 3) completeMission(profile, "quiz3");
    if (todayStats.lastQuizPerfect) completeMission(profile, "hatasiz");
}
function completeMission(profile, missionId) {
    const today = (new Date()).toISOString().slice(0,10);
    if (!profile.missions) profile.missions = [];
    const done = profile.missions.find(x => x.id === missionId && x.date === today);
    if (!done) {
        profile.missions.push({ id: missionId, date: today, completed: true });
        const m = DAILY_MISSIONS.find(m => m.id === missionId);
        if (m && m.reward.xp) profile.xp += m.reward.xp;
        alert(`Görev tamamlandı: ${m.title}\n+${m.reward.xp} XP!`);
    }
}

// --- Başarımlar Kontrolü ---
const ACHIEVEMENTS = [
    { id: "ilk10quiz", title: "Quiz Ustası", desc: "İlk 10 quizini tamamla", icon: "assets/badges/ilk10quiz.svg" }
];
function checkAchievements(profile, stats) {
    if (!profile.achievements) profile.achievements = [];
    if (profile.totalQuiz >= 10 && !profile.achievements.includes("ilk10quiz")) {
        unlockAchievement(profile, "ilk10quiz");
    }
}
function unlockAchievement(profile, id) {
    profile.achievements.push(id);
    const a = ACHIEVEMENTS.find(a=>a.id===id);
    alert(`Başarı kazandın: ${a.title}`);
}

// --- Sonuçları göster + Oyunlaştırma ---
function showResults() {
    elements.testModu.style.display = 'none';
    elements.yaziliModu.style.display = 'none';
    elements.resultCard.style.display = 'block';

    const total = usedQuestionIndices.length;
    const percentage = Math.round((score / total) * 100);
    let emoji = "😊";
    if (percentage >= 90) emoji = "🏆";
    else if (percentage >= 70) emoji = "🎉";
    else if (percentage >= 50) emoji = "👍";
    else if (percentage >= 30) emoji = "🤔";
    else emoji = "😢";
    elements.scoreText.innerHTML = `Skor: <strong>${score}/${total}</strong> (${percentage}%) ${emoji}`;

    // --- Oyunlaştırma: XP, seviye, seri, rozet güncelle ---
    userProfile.xp += score * XP_PER_CORRECT;
    userProfile.totalCorrect += score;
    userProfile.totalWrong += (total - score);
    userProfile.totalQuiz++;

    // Günlük istatistikler
    const today = (new Date()).toISOString().slice(0,10);
    if (!userProfile.lastMissionDate || userProfile.lastMissionDate !== today) {
        userProfile.correctToday = score;
        userProfile.quizCountToday = 1;
        userProfile.lastMissionDate = today;
    } else {
        userProfile.correctToday += score;
        userProfile.quizCountToday += 1;
    }

    // Günlük seri ve hafta içi günler
    if (userProfile.lastQuizDate && userProfile.lastQuizDate !== today) {
        const diff = (new Date(today) - new Date(userProfile.lastQuizDate)) / (1000*60*60*24);
        userProfile.dailyStreak = diff === 1 ? userProfile.dailyStreak + 1 : 1;
    } else if (!userProfile.lastQuizDate) {
        userProfile.dailyStreak = 1;
    }
    userProfile.lastQuizDate = today;
    userProfile.last7Days = (userProfile.last7Days || []).filter(d => {
        return (new Date(today) - new Date(d)) <= 6 * 24 * 60 * 60 * 1000;
    });
    if (!userProfile.last7Days.includes(today)) userProfile.last7Days.push(today);

    // Seviye ve rozet güncelle
    let levelObj = calculateLevel(userProfile.xp);
    userProfile.level = levelObj.level;
    if (score > 0 && !userProfile.badges.includes('ilk-quiz')) userProfile.badges.push('ilk-quiz');
    if (userProfile.dailyStreak >= 3 && !userProfile.badges.includes('streak-3gun')) userProfile.badges.push('streak-3gun');
    if (userProfile.totalCorrect >= 100 && !userProfile.badges.includes('100dogru')) userProfile.badges.push('100dogru');
    let uniqueDays = [...new Set(userProfile.last7Days)];
    if (uniqueDays.length >= 5 && !userProfile.badges.includes('hafta-quiz')) userProfile.badges.push('hafta-quiz');
    if (userProfile.totalQuiz >= 10 && !userProfile.badges.includes('ilk10quiz')) userProfile.badges.push('ilk10quiz');

    saveProfile(userProfile);

    // Görevler ve başarımlar
    let todayStats = {
        correctToday: userProfile.correctToday,
        quizCountToday: userProfile.quizCountToday,
        lastQuizPerfect: (score === usedQuestionIndices.length)
    };
    checkDailyMissions(userProfile, todayStats);
    checkAchievements(userProfile, {});

    showGamificationArea(levelObj);

    // Detaylı rapor
    let reportHTML = `
        <div class="mt-4">
            <h5 class="mb-3"><i class="bi bi-list-check"></i> Detaylı Sonuçlar</h5>
            <div class="table-responsive">
                <table class="table table-bordered result-table">
                    <thead>
                        <tr>
                            <th><i class="bi bi-question-circle"></i> Soru</th>
                            <th><i class="bi bi-person"></i> Senin Cevabın</th>
                            <th><i class="bi bi-check-circle"></i> Doğru Cevap</th>
                            <th><i class="bi bi-clipboard-check"></i> Durum</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    userAnswers.forEach((answer, index) => {
        const questionText = answer.questionType === 'meaning' 
            ? answer.question.word 
            : answer.question.meaning;
        const userAnswerText = answer.userAnswer || "Boş";
        const correctAnswerText = answer.questionType === 'meaning' 
            ? answer.question.meaning 
            : answer.question.transliteration;
        reportHTML += `
            <tr>
                <td>${questionText}</td>
                <td>${userAnswerText}</td>
                <td>${correctAnswerText}</td>
                <td class="${answer.isCorrect ? 'text-success' : 'text-danger'}">
                    ${answer.isCorrect ? '<i class="bi bi-check-circle"></i> Doğru' : '<i class="bi bi-x-circle"></i> Yanlış'}
                </td>
            </tr>
        `;
    });
    reportHTML += `
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-between mt-4">
                <button id="restartQuizBtn" class="btn btn-success">
                    <i class="bi bi-arrow-repeat"></i> Tekrar Başlat
                </button>
                <a href="index.html" class="btn btn-outline-primary">
                    <i class="bi bi-house"></i> Ana Sayfa
                </a>
            </div>
        </div>
    `;
    elements.resultCard.innerHTML += reportHTML;

    // Günlük görevler kutucuğu
    const missions = getMissionStatus(userProfile);
    let missionHtml = `<div class="mt-3"><b>Günlük Görevler</b><ul>`;
    missions.forEach(m => {
      missionHtml += `<li>${m.completed ? "✅" : "⬜"} <b>${m.title}</b>: ${m.desc}</li>`;
    });
    missionHtml += `</ul></div>`;
    elements.resultCard.innerHTML += missionHtml;

    // Başarımlar kutucuğu
    let achHtml = '';
    if (userProfile.achievements && userProfile.achievements.length > 0) {
        achHtml = `<div class="mt-3"><b>Başarımlar</b><ul>`;
        userProfile.achievements.forEach(id => {
            const a = ACHIEVEMENTS.find(a=>a.id===id);
            if(a) achHtml += `<li>🏅 <b>${a.title}</b>: ${a.desc}</li>`;
        });
        achHtml += `</ul></div>`;
        elements.resultCard.innerHTML += achHtml;
    }

    document.getElementById('restartQuizBtn').addEventListener('click', () => {
        elements.resultCard.style.display = 'none';
        elements.resultCard.innerHTML = `
            <div class="card-body">
                <h4 class="mb-3"><i class="bi bi-award"></i> Quiz Tamamlandı!</h4>
                <p id="scoreText" class="fs-4">Skor: 0/0</p>
            </div>
        `;
        shuffleQuestions();
        loadQuestion();
    });
}

// Oyunlaştırma UI ekle
function showGamificationArea(levelObj) {
    const gamificationId = "gamificationArea";
    let gamificationDiv = document.getElementById(gamificationId);
    if (!gamificationDiv) {
        gamificationDiv = document.createElement('div');
        gamificationDiv.id = gamificationId;
        elements.resultCard.appendChild(gamificationDiv);
    }
    let basari = userProfile.totalQuiz > 0 ? Math.round(100 * userProfile.totalCorrect / (userProfile.totalCorrect + userProfile.totalWrong)) : 0;
    const badgeIcons = BADGES.map(
        b => userProfile.badges.includes(b.id)
            ? `<img class="badge-img" src="${b.icon}" alt="${b.title}" title="${b.title}: ${b.desc}">`
            : `<img class="badge-img opacity-25" src="${b.icon}" alt="Kilitli" title="Kilitli: ${b.desc}">`
    ).join('');
    const sampleUsers = [
        {username:"ayseogretmen", xp:2450},
        {username:"mehmet123", xp:1250},
        {username:userProfile.username, xp:userProfile.xp}
    ];
    sampleUsers.sort((a,b)=>b.xp-a.xp);
    const leaderboardHTML = `<h5 class="mt-4">Puan Tablosu</h5>
        <ol>${sampleUsers.map((u,i)=>`<li${u.username===userProfile.username?' style="color:#007aff;font-weight:bold"':''}><b>${u.username}</b> – ${u.xp} XP</li>`).join('')}</ol>`;

    gamificationDiv.innerHTML = `
        <div class="alert alert-light border text-start mt-4">
            <div class="mb-2">Seviye <b>${levelObj.level}</b>
                <div class="xp-bar bg-light border rounded mb-1" style="height:16px; overflow:hidden;">
                    <div class="xp-fill bg-primary" style="width:${(levelObj.currentXP/levelObj.nextLevelXP*100).toFixed(0)}%;height:100%;"></div>
                </div>
                <small>${levelObj.currentXP} / ${levelObj.nextLevelXP} XP</small>
            </div>
            <div class="mb-2">Seri: <b>${userProfile.dailyStreak}</b> gün</div>
            <div class="mb-2">Doğru/Yanlış: <b>${userProfile.totalCorrect}</b> / <b>${userProfile.totalWrong}</b> &nbsp; Başarı: <b>%${basari}</b></div>
            <div class="badges mb-2">Rozetler: <span>${badgeIcons}</span></div>
        </div>
        ${leaderboardHTML}
    `;
}

// İlerleme Çubuğu
function updateProgress() {
    const progress = (currentQuestion / usedQuestionIndices.length) * 100;
    elements.quizProgress.style.width = `${progress}%`;
    elements.progressText.textContent = `${currentQuestion}/${usedQuestionIndices.length}`;
}

// Quiz Modu Değiştirici
elements.testModuBtn.addEventListener('click', () => {
    quizMode = 'test';
    elements.testModuBtn.classList.add('active');
    elements.yaziliModuBtn.classList.remove('active');
    shuffleQuestions();
    loadQuestion();
});
elements.yaziliModuBtn.addEventListener('click', () => {
    quizMode = 'yazili';
    elements.yaziliModuBtn.classList.add('active');
    elements.testModuBtn.classList.remove('active');
    shuffleQuestions();
    loadQuestion();
});

// Tema Değiştirme
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.body.className = `${this.dataset.theme}-theme`;
        localStorage.setItem('osmanlicaTheme', this.dataset.theme);
    });
});

// Sayfa Yüklenince
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('osmanlicaTheme') || 'light';
    document.body.className = `${savedTheme}-theme`;
    document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`).classList.add('active');
    startQuiz();
});

/* --- Ek Stil (CSS'e ekleyiniz) ---
.xp-bar { width: 100%; height: 16px; background: #e7e6f3; border-radius: 8px; margin: 6px 0; overflow: hidden;}
.xp-fill { height: 100%; background: linear-gradient(90deg,#7fd0fc,#637dff); border-radius: 8px;}
.badges img.badge-img { vertical-align: middle; margin-right: 4px; width: 32px; transition: filter .2s;}
.badges img.opacity-25 { filter: grayscale(1) brightness(.7);}
.badges img.badge-img:hover { filter: none !important; transform: scale(1.08);}
*/