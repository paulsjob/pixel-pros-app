export type SportId = 'nfl' | 'nba' | 'soccer' | 'baseball';

export interface Sport {
  id: SportId;
  name: string;
  category: string;
  seasonLabel: string;
  icon: string;
}

export interface AvatarConfig {
  helmetColor: string;
  jerseyColor: string;
  stripeColor: string;
  skinTone: string;
  number: number;
}

export interface Competitor {
  id: string;
  sportId: SportId;
  displayName: string;
  shortName: string;
  uniformNumber: number;
  teamName: string;
  teamCode: string;
  positionGeneric: 'OFFENSE' | 'DEFENSE' | 'SCORER' | 'PLAYMAKER';
  rating: number;
  stats: {
    passingYards: number;
    rushingYards: number;
    touchdowns: number;
    primaryMetricLabel: string;
    primaryMetricValue: number;
  };
  badges: string[];
  score: number;
  avatar: AvatarConfig;
}

export interface ScoringRule {
  id: string;
  sportId: SportId;
  eventType: string;
  displayName: string;
  pointsValue: number; // Strictly whole numbers for kids!
  description: string;
}

export interface Match {
  id: string;
  sportId: SportId;
  homeTeam: string;
  awayTeam: string;
  status: 'upcoming' | 'live' | 'final';
  periodLabel: string;
  homeScore: number;
  awayScore: number;
  recentEvent?: string;
}

export interface LeaderboardEntry {
  rank: number | string;
  username: string;
  score: number;
  isFriend: boolean;
  isYou: boolean;
  avatar: AvatarConfig;
  badges?: string[];
}

export interface UserProfile {
  username: string;
  coins: number;
  totalScore: number;
  badges: string[];
  avatar: AvatarConfig;
  selectedPlayerIds: string[];
}
