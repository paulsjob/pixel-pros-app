/**
 * Official NFL 32 Team Metadata & Formatting Helpers
 * Strictly authentic colors, full names, and game situation formatters.
 */

export interface TeamMeta {
  code: string;
  name: string;
  helmetColor: string;
  jerseyColor: string;
  stripeColor: string;
}

export const NFL_TEAMS: Record<string, TeamMeta> = {
  ARI: { code: 'ARI', name: 'Arizona Cardinals', helmetColor: '#97233f', jerseyColor: '#97233f', stripeColor: '#ffffff' },
  ATL: { code: 'ATL', name: 'Atlanta Falcons', helmetColor: '#a71930', jerseyColor: '#000000', stripeColor: '#ffffff' },
  BAL: { code: 'BAL', name: 'Baltimore Ravens', helmetColor: '#241773', jerseyColor: '#241773', stripeColor: '#ffffff' },
  BUF: { code: 'BUF', name: 'Buffalo Bills', helmetColor: '#00338d', jerseyColor: '#00338d', stripeColor: '#c60c30' },
  CAR: { code: 'CAR', name: 'Carolina Panthers', helmetColor: '#0085ca', jerseyColor: '#0085ca', stripeColor: '#ffffff' },
  CHI: { code: 'CHI', name: 'Chicago Bears', helmetColor: '#0b162a', jerseyColor: '#0b162a', stripeColor: '#c83803' },
  CIN: { code: 'CIN', name: 'Cincinnati Bengals', helmetColor: '#fb4f14', jerseyColor: '#000000', stripeColor: '#ffffff' },
  CLE: { code: 'CLE', name: 'Cleveland Browns', helmetColor: '#ff3c00', jerseyColor: '#311d00', stripeColor: '#ffffff' },
  DAL: { code: 'DAL', name: 'Dallas Cowboys', helmetColor: '#041e42', jerseyColor: '#003594', stripeColor: '#ffffff' },
  DEN: { code: 'DEN', name: 'Denver Broncos', helmetColor: '#002244', jerseyColor: '#fb4f14', stripeColor: '#ffffff' },
  DET: { code: 'DET', name: 'Detroit Lions', helmetColor: '#0076b6', jerseyColor: '#0076b6', stripeColor: '#b0b7bc' },
  GB:  { code: 'GB',  name: 'Green Bay Packers', helmetColor: '#ffb612', jerseyColor: '#203731', stripeColor: '#ffffff' },
  HOU: { code: 'HOU', name: 'Houston Texans', helmetColor: '#03202f', jerseyColor: '#03202f', stripeColor: '#a71930' },
  IND: { code: 'IND', name: 'Indianapolis Colts', helmetColor: '#002c5f', jerseyColor: '#002c5f', stripeColor: '#ffffff' },
  JAX: { code: 'JAX', name: 'Jacksonville Jaguars', helmetColor: '#006778', jerseyColor: '#006778', stripeColor: '#d7a22a' },
  KC:  { code: 'KC',  name: 'Kansas City Chiefs', helmetColor: '#e31837', jerseyColor: '#e31837', stripeColor: '#ffb81c' },
  LAC: { code: 'LAC', name: 'Los Angeles Chargers', helmetColor: '#0080c6', jerseyColor: '#0080c6', stripeColor: '#ffc20e' },
  LAR: { code: 'LAR', name: 'Los Angeles Rams', helmetColor: '#003594', jerseyColor: '#003594', stripeColor: '#ffa300' },
  LV:  { code: 'LV',  name: 'Las Vegas Raiders', helmetColor: '#a5acaf', jerseyColor: '#000000', stripeColor: '#ffffff' },
  MIA: { code: 'MIA', name: 'Miami Dolphins', helmetColor: '#008e97', jerseyColor: '#008e97', stripeColor: '#fc4c02' },
  MIN: { code: 'MIN', name: 'Minnesota Vikings', helmetColor: '#4f2683', jerseyColor: '#4f2683', stripeColor: '#ffc62f' },
  NE:  { code: 'NE',  name: 'New England Patriots', helmetColor: '#002244', jerseyColor: '#002244', stripeColor: '#c60c30' },
  NO:  { code: 'NO',  name: 'New Orleans Saints', helmetColor: '#d3bc8d', jerseyColor: '#101820', stripeColor: '#d3bc8d' },
  NYG: { code: 'NYG', name: 'New York Giants', helmetColor: '#0b2265', jerseyColor: '#0b2265', stripeColor: '#a71930' },
  NYJ: { code: 'NYJ', name: 'New York Jets', helmetColor: '#125740', jerseyColor: '#125740', stripeColor: '#ffffff' },
  PHI: { code: 'PHI', name: 'Philadelphia Eagles', helmetColor: '#004c54', jerseyColor: '#004c54', stripeColor: '#a5acaf' },
  PIT: { code: 'PIT', name: 'Pittsburgh Steelers', helmetColor: '#101820', jerseyColor: '#101820', stripeColor: '#ffb612' },
  SEA: { code: 'SEA', name: 'Seattle Seahawks', helmetColor: '#002244', jerseyColor: '#002244', stripeColor: '#69be28' },
  SF:  { code: 'SF',  name: 'San Francisco 49ers', helmetColor: '#aa0000', jerseyColor: '#aa0000', stripeColor: '#b3995d' },
  TB:  { code: 'TB',  name: 'Tampa Bay Buccaneers', helmetColor: '#d50a0a', jerseyColor: '#d50a0a', stripeColor: '#34302b' },
  TEN: { code: 'TEN', name: 'Tennessee Titans', helmetColor: '#0c2340', jerseyColor: '#4b92db', stripeColor: '#c8102e' },
  WSH: { code: 'WSH', name: 'Washington Commanders', helmetColor: '#5a1414', jerseyColor: '#5a1414', stripeColor: '#ffb612' },
};

export function getTeamFullName(teamCode?: string): string {
  if (!teamCode) return 'NFL';
  const clean = teamCode.trim().toUpperCase();
  return NFL_TEAMS[clean]?.name || clean;
}

export function getTeamColors(teamCode?: string): { helmet: string; jersey: string; stripe: string } {
  if (!teamCode) return { helmet: '#12579b', jersey: '#12579b', stripe: '#ffffff' };
  const clean = teamCode.trim().toUpperCase();
  const found = NFL_TEAMS[clean];
  if (found) {
    return {
      helmet: found.helmetColor,
      jersey: found.jerseyColor,
      stripe: found.stripeColor,
    };
  }
  return { helmet: '#12579b', jersey: '#12579b', stripe: '#ffffff' };
}

// Known superstar uniform numbers
const KNOWN_NUMBERS: Record<string, number> = {
  'josh allen': 17,
  'patrick mahomes': 15,
  'derrick henry': 22,
  'ceedee lamb': 88,
  'saquon barkley': 26,
  'jalen hurts': 1,
  'justin jefferson': 18,
  'christian mccaffrey': 23,
  'trevor lawrence': 16,
  'lamar jackson': 8,
  'travis kelce': 87,
  'rashee rice': 4,
  'tyler shough': 12,
  'c.j. stroud': 7,
  'joe burrow': 9,
  'baker mayfield': 6,
  'drake maye': 10,
  'jahmyr gibbs': 26,
  'drew lock': 2,
  'amon-ra st. brown': 14,
  'jayden daniels': 5,
  'stefon diggs': 1,
  'caleb williams': 18,
  'dj moore': 2,
  'dallas goedert': 88,
};

export function getUniformNumber(name?: string, id?: string): number {
  if (name) {
    const key = name.trim().toLowerCase();
    if (KNOWN_NUMBERS[key]) return KNOWN_NUMBERS[key];
  }
  if (id) {
    const numPart = id.replace(/\D/g, '');
    if (numPart) {
      const val = parseInt(numPart.slice(-2), 10);
      return val > 0 && val <= 99 ? val : 11;
    }
  }
  return 10;
}

/**
 * Renders real-time game situation string strictly according to spec:
 * `{match.quarter_time} · {match.away_team} {match.away_score} - {match.home_team} {match.home_score}`
 */
export function formatRealtimeGameSituation(
  match: {
    quarter_time?: string;
    quarterTime?: string;
    periodLabel?: string;
    away_team?: string;
    awayTeamCode?: string;
    home_team?: string;
    homeTeamCode?: string;
    away_score?: number;
    awayScore?: number;
    home_score?: number;
    homeScore?: number;
  }
): string {
  const time = (match.quarter_time || match.quarterTime || match.periodLabel || 'LIVE').trim();
  const away = (match.away_team || match.awayTeamCode || '').trim().toUpperCase();
  const home = (match.home_team || match.homeTeamCode || '').trim().toUpperCase();
  const aScore = match.away_score ?? match.awayScore ?? 0;
  const hScore = match.home_score ?? match.homeScore ?? 0;

  return `${time} · ${away} ${aScore} - ${home} ${hScore}`;
}
