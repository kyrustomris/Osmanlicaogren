export const BADGES = [
    {
        id: "ilk-quiz",
        title: "İlk Quiz",
        desc: "İlk quizini tamamla",
        icon: "assets/badges/ilk-quiz.svg"
    },
    {
        id: "streak-3gun",
        title: "3 Günlük Seri",
        desc: "3 gün üst üste quiz çöz",
        icon: "assets/badges/streak-3gun.svg"
    }
];

export function calculateLevel(xp) {
    let level = 1;
    let requiredXP = 100;
    let curXP = xp;
    while (curXP >= requiredXP) {
        curXP -= requiredXP;
        level++;
        requiredXP = Math.floor(requiredXP * 1.2);
    }
    return { level, currentXP: curXP, nextLevelXP: requiredXP };
}