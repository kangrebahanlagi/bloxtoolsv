export const siteConfig = {
  name: "BloxTools",
  webhookUrl: "https://discord.com/api/webhooks/1498409090701987960/-C42DQziUsV6V-VDokUYlsRZD9KeYhpLLg2eCuAI7cjovLxPkuXuf1KanbIqeWkw_J0s",
};

export const toolsConfig = {
  botFollowers: {
    youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_ME",
  },
  copyGames: {
    youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_ME",
  },
  copyClothes: {
    youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_ME",
  },
  groupBotter: {
    youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_ME",
  },
  vcEnabler: {
    youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_ME",
  },
};

// Rank tiers (linear progression). Index 0 = lowest rank.
export const RANKS: { name: string; min: number }[] = [
  { name: "Beginner Beamer", min: 0 },
  { name: "Low Beamer", min: 10 },
  { name: "Novice Beamer", min: 25 },
  { name: "Average Beamer", min: 50 },
  { name: "Decent Beamer", min: 100 },
  { name: "Solid Beamer", min: 200 },
  { name: "Good Beamer", min: 350 },
  { name: "Advanced Beamer", min: 550 },
  { name: "Pro Beamer", min: 800 },
  { name: "Top Beamer", min: 1200 },
];

export function getRank(hits: number) {
  let current = RANKS[0];
  let next: { name: string; min: number } | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (hits >= RANKS[i].min) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  return { current, next };
}
