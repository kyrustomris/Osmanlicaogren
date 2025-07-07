// Günlük görevler tanımı
const DAILY_MISSIONS = [
  {
    id: "dogru5",
    title: "Bugün 5 Doğru Cevap",
    desc: "Bir günde 5 doğru cevap ver.",
    reward: { xp: 50 }
  },
  {
    id: "quiz3",
    title: "3 Quiz Çöz",
    desc: "Bugün 3 farklı quiz tamamla.",
    reward: { xp: 100 }
  },
  {
    id: "hatasiz",
    title: "Hatasız Quiz",
    desc: "Quizde hiç yanlış yapmadan tamamla.",
    reward: { xp: 70 }
  }
];

// Kullanıcı profiline güncel görev durumu ekle
function getMissionStatus(profile) {
  const today = (new Date()).toISOString().slice(0,10);
  if (!profile.missions) profile.missions = [];
  // Sadece bugünkü görevleri döndür
  return DAILY_MISSIONS.map(m => {
    const done = profile.missions.find(x => x.id === m.id && x.date === today);
    return { ...m, completed: !!done };
  });
}

// Görevleri quiz sonunda kontrol et
function checkDailyMissions(profile, todayStats) {
  const today = (new Date()).toISOString().slice(0,10);
  if (!profile.missions) profile.missions = [];
  // Görev koşulları
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
    // İstersen burada görsel/bildirim animasyonu da ekleyebilirsin
  }
}