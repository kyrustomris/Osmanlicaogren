const ACHIEVEMENTS = [
  {
    id: "ilk10quiz",
    title: "Quiz Ustası",
    desc: "İlk 10 quizini tamamla",
    icon: "assets/badges/ilk10quiz.svg"
  },
  {
    id: "gecequiz",
    title: "Gece Yarısı Quizcisi",
    desc: "Gece 00:00-02:00 arasında quiz çöz",
    icon: "assets/badges/gecequiz.svg"
  },
  {
    id: "hatasiz10",
    title: "10 Hatasız Quiz",
    desc: "10 quiz üst üste hatasız yap",
    icon: "assets/badges/hatasiz10.svg"
  }
];

// Kontrol fonksiyonu quiz sonunda çağrılmalı
function checkAchievements(profile, stats) {
  if (!profile.achievements) profile.achievements = [];
  // İlk 10 quiz
  if (profile.totalQuiz >= 10 && !profile.achievements.includes("ilk10quiz")) {
    unlockAchievement(profile, "ilk10quiz");
  }
  // Gece quiz
  const now = new Date();
  if (now.getHours() >= 0 && now.getHours() < 2 && !profile.achievements.includes("gecequiz")) {
    unlockAchievement(profile, "gecequiz");
  }
  // 10 hatasız quiz
  if (stats.perfectStreak >= 10 && !profile.achievements.includes("hatasiz10")) {
    unlockAchievement(profile, "hatasiz10");
  }
}

function unlockAchievement(profile, id) {
  profile.achievements.push(id);
  const a = ACHIEVEMENTS.find(a=>a.id===id);
  alert(`Başarı kazandın: ${a.title}`);
  // Buraya animasyon/görsel ekleyebilirsin
}