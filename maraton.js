let marathonScore = 0;
let marathonTime = 60;
let marathonInterval;

function startMarathon() {
  marathonScore = 0;
  marathonTime = 60;
  nextMarathonQuestion();
  marathonInterval = setInterval(() => {
    marathonTime--;
    updateMarathonTimerUI(marathonTime);
    if (marathonTime <= 0) endMarathon();
  }, 1000);
}

function nextMarathonQuestion() {
  // Rastgele quizData'dan soru seç, arayüzde göster
  // Kullanıcı doğru bilirse marathonScore++
  // Sonra tekrar nextMarathonQuestion() çağır (marathonTime bitene kadar)
}

function endMarathon() {
  clearInterval(marathonInterval);
  let best = localStorage.getItem("marathonBestScore") || 0;
  if (marathonScore > best) {
    localStorage.setItem("marathonBestScore", marathonScore);
    alert("Tebrikler, yeni rekor! Skor: " + marathonScore);
  } else {
    alert("Skorun: " + marathonScore + ". Daha iyi olabilirsin!");
  }
}