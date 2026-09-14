import { createClient } from '@supabase/supabase-js';
import { Competitor, Match, UserRoster } from '../types';
import { getDeviceId } from './deviceIdentity';
import { getTeamColors, getTeamFullName, getUniformNumber } from '../utils/teamData';

// Ensure Supabase URL and Keys are populated from Vite defines or process.env
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const procEnv = typeof process !== 'undefined' ? process.env : {};

export const SUPABASE_URL =
  procEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv?.SUPABASE_URL ||
  metaEnv?.VITE_SUPABASE_URL ||
  'https://sqntjgjqtwbcqpxcqzbg.supabase.co';

export const SUPABASE_ANON_KEY =
  procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv?.SUPABASE_ANON_KEY ||
  procEnv?.SUPABASE_SERVICE_ROLE_KEY ||
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  '';

// Supabase client instance with Realtime enabled
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const SKIN_TONES = ['#f7d7b5', '#d98c55', '#8c532b', '#e6ba8c', '#5c3509'];
function getSkinTone(name?: string): string {
  if (!name) return '#d98c55';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return SKIN_TONES[Math.abs(hash) % SKIN_TONES.length];
}

/**
 * Maps a single Supabase `competitors` database row directly to our frontend Competitor model.
 */
export function mapRowToCompetitor(row: any): Competitor {
  const rawId = String(row.id || '');
  const rawName = String(row.name || row.display_name || 'NFL Pro').trim();
  const rawTeam = String(row.team || row.team_code || 'NFL').trim().toUpperCase();
  const rawPos = String(row.position || 'STAR').trim().toUpperCase();
  const rawScore = Math.max(0, Math.round(Number(row.score ?? row.fantasy_points ?? 0)));

  const statsObj = typeof row.stats === 'object' && row.stats !== null ? row.stats : {};
  const passYds = Number(statsObj.pass_yds ?? statsObj.passing_yards ?? statsObj.passingYards ?? 0);
  const rushYds = Number(statsObj.rush_yds ?? statsObj.rushing_yards ?? statsObj.rushingYards ?? 0);
  const recYds = Number(statsObj.rec_yds ?? statsObj.receiving_yards ?? statsObj.receivingYards ?? 0);
  const tds = Number(statsObj.tds ?? statsObj.touchdowns ?? 0);
  const fgs = Number(statsObj.fgs ?? statsObj.field_goals ?? 0);
  const stops = Number(statsObj.stops ?? statsObj.defensive_stops ?? 0);
  const totalScrimmageYards = passYds + rushYds + recYds;

  const parts = rawName.split(/\s+/);
  const shortName = (parts[parts.length - 1] || 'PRO').toUpperCase();
  const uniformNum = Number(row.uniform_number || row.jersey_number || getUniformNumber(rawName, rawId));
  const teamColors = getTeamColors(rawTeam);

  return {
    id: rawId,
    sportId: 'nfl',
    displayName: rawName,
    shortName,
    uniformNumber: uniformNum,
    teamName: getTeamFullName(rawTeam),
    teamCode: rawTeam,
    positionGeneric: rawPos === 'K' ? 'SCORER' : 'OFFENSE',
    position: rawPos,
    rating: rawScore > 30 ? 99 : rawScore > 15 ? 93 : 88,
    score: rawScore,
    stats: {
      ...statsObj,
      pass_yds: passYds,
      rush_yds: rushYds,
      rec_yds: recYds,
      tds: tds,
      fgs: fgs,
      stops: stops,
      passingYards: passYds,
      rushingYards: rushYds,
      receivingYards: recYds,
      touchdowns: tds,
      total_yards: totalScrimmageYards,
      primaryMetricLabel: 'Touchdowns',
      primaryMetricValue: tds,
    },
    badges: rawScore >= 30 ? ['diamond_crystal', 'gold_star'] : rawScore >= 15 ? ['gold_star'] : ['shield_badge'],
    avatar: {
      helmetColor: teamColors.helmet,
      jerseyColor: teamColors.jersey,
      stripeColor: teamColors.stripe,
      skinTone: getSkinTone(rawName),
      number: uniformNum,
    },
  };
}

/**
 * Fetches real active NFL competitors 100% directly from the Supabase competitors table.
 * Strictly presents athletes in that query with genuine database scores and team affiliations.
 */
export async function fetchLiveNFLCompetitors(): Promise<Competitor[]> {
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.warn('⚡ Error fetching competitors from Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapRowToCompetitor).sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn('⚡ Live Supabase fetch encountered exception:', err);
    return [];
  }
}

/**
 * Fetches real NFL games directly from the Supabase matches table (sport = 'nfl').
 * Maps columns: home_team, away_team, home_score, away_score, quarter_time, status.
 */
export async function fetchLiveNFLMatches(): Promise<Match[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('sport', 'nfl');

    if (error) {
      console.warn('⚡ Error fetching matches from Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any): Match => {
      const homeCode = String(row.home_team || row.home_team_code || '').trim().toUpperCase();
      const awayCode = String(row.away_team || row.away_team_code || '').trim().toUpperCase();
      const rawStatus = String(row.status || '').toLowerCase();
      const qTime = String(row.quarter_time || '').trim();

      const isFinal = rawStatus === 'final' || qTime.toLowerCase().includes('final');
      const isLive = rawStatus === 'live' || (!isFinal && (qTime.includes('th') || qTime.includes('1st') || qTime.includes('2nd') || qTime.includes('3rd') || qTime.includes('Half') || qTime.includes('OT')));
      const isScheduled = !isFinal && !isLive;

      const awayScore = Number(row.away_score || 0);
      const homeScore = Number(row.home_score || 0);

      return {
        id: String(row.id),
        sportId: 'nfl',
        homeTeam: getTeamFullName(homeCode),
        awayTeam: getTeamFullName(awayCode),
        homeTeamCode: homeCode,
        awayTeamCode: awayCode,
        home_team: homeCode,
        away_team: awayCode,
        home_score: homeScore,
        away_score: awayScore,
        quarter_time: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        quarterTime: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        status: isFinal ? 'final' : isLive ? 'live' : 'upcoming',
        periodLabel: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        homeScore,
        awayScore,
      };
    });
  } catch (err) {
    console.warn('⚡ Live Supabase matches fetch encountered exception:', err);
    return [];
  }
}

function sanitizeCompetitorId(id?: string | null): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  // If it is a legacy placeholder rather than genuine ID, reject to prevent foreign key errors
  if (['mahomes', 'henry', 'lamb', 'allen', 'jackson', 'barkley', 'jefferson'].includes(trimmed)) return null;
  return trimmed;
}

/**
 * Upsert picks directly to Supabase table `user_rosters`:
 * { room_code: cleanRoom, user_name: cleanName, star_1_id, star_2_id, star_3_id, device_id: isLocked ? 'LOCKED' : 'UNLOCKED', updated_at: new Date().toISOString() }
 * Uses unique constraint (room_code, user_name).
 */
export async function upsertUserRoster(
  roomCode: string,
  userName: string,
  star1Id?: string | null,
  star2Id?: string | null,
  star3Id?: string | null,
  isLocked?: boolean
): Promise<{ success: boolean; data?: UserRoster }> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();

  const sanitizedS1 = sanitizeCompetitorId(star1Id);
  const sanitizedS2 = sanitizeCompetitorId(star2Id);
  const sanitizedS3 = sanitizeCompetitorId(star3Id);

  const record: UserRoster = {
    room_code: cleanRoom,
    user_name: cleanName,
    device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
    star_1_id: sanitizedS1 || '',
    star_2_id: sanitizedS2 || '',
    star_3_id: sanitizedS3 || '',
    is_locked: isLocked ?? false,
    updated_at: new Date().toISOString(),
  };

  // Sync to local room cache (keyed strictly by room & user_name)
  try {
    const localKey = `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    let rosters: UserRoster[] = raw ? JSON.parse(raw) : [];
    const idx = rosters.findIndex(
      (r) => r.user_name.toUpperCase() === cleanName
    );
    if (idx >= 0) {
      rosters[idx] = { ...rosters[idx], ...record };
    } else {
      rosters.push(record);
    }
    localStorage.setItem(localKey, JSON.stringify(rosters));

    // Save lock state explicitly per room and user_name
    localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`, isLocked ? 'true' : 'false');
    // Save user's roster for this specific squad & room
    localStorage.setItem(`pixel_pros_roster_${cleanRoom}_${cleanName}`, JSON.stringify([record.star_1_id, record.star_2_id, record.star_3_id]));
    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: record }));
  } catch {
    // ignore
  }

  // Upsert to Supabase table user_rosters with onConflict: 'room_code, user_name'
  try {
    const payload: any = {
      room_code: cleanRoom,
      user_name: cleanName,
      star_1_id: sanitizedS1,
      star_2_id: sanitizedS2,
      star_3_id: sanitizedS3,
      device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
      updated_at: record.updated_at,
    };

    const { error } = await supabase
      .from('user_rosters')
      .upsert(payload, { onConflict: 'room_code, user_name' });

    if (error) {
      console.warn('Supabase user_rosters upsert notice:', error.message);
      return { success: false, data: record };
    }
    return { success: true, data: record };
  } catch (err) {
    console.warn('Supabase user_rosters network notice:', err);
    return { success: false, data: record };
  }
}

export const GHOST_USER_NAMES = ['P', 'PA', 'PAU', 'PAUL J'];

export function isGhostUser(name?: string | null): boolean {
  if (!name || !name.trim()) return true;
  return GHOST_USER_NAMES.includes(name.trim().toUpperCase());
}

/**
 * Queries user_rosters where room_code = currentRoomCode (strict uppercase).
 * Strict database identity is (room_code, user_name).
 */
export async function fetchRoomRosters(roomCode: string): Promise<UserRoster[]> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();

  // Load local cache first (purging any ghost entries)
  let localRosters: UserRoster[] = [];
  try {
    const raw = localStorage.getItem(`pixel_pros_rosters_${cleanRoom}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localRosters = parsed.filter((r: UserRoster) => !isGhostUser(r.user_name));
      }
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from('user_rosters')
      .select('*')
      .eq('room_code', cleanRoom)
      .not('user_name', 'is', null)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return localRosters;
    }

    // Merge Supabase records with local records: deduplicate strictly by user_name.toUpperCase()
    const map = new Map<string, UserRoster>();
    localRosters.forEach((r) => {
      if (isGhostUser(r.user_name)) return;
      const key = r.user_name.trim().toUpperCase();
      map.set(key, r);
    });

    data.forEach((r: any) => {
      if (isGhostUser(r.user_name)) return;
      const key = (r.user_name || '').trim().toUpperCase();
      if (!key) return;

      const isLocked =
        r.device_id === 'LOCKED' ||
        localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${key}`) === 'true';

      const entry: UserRoster = {
        id: r.id,
        room_code: (r.room_code || '').toUpperCase(),
        user_name: key,
        device_id: r.device_id,
        star_1_id: r.star_1_id || '',
        star_2_id: r.star_2_id || '',
        star_3_id: r.star_3_id || '',
        is_locked: isLocked,
        updated_at: r.updated_at,
      };
      map.set(key, entry);
    });

    return Array.from(map.values());
  } catch {
    return localRosters;
  }
}

/**
 * Deletes a squad/user_roster entry from Supabase and local cache.
 */
export async function deleteUserRoster(roomCode: string, userName: string): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || '').trim().toUpperCase();
  if (!cleanName) return false;

  try {
    // 1. Remove from localStorage cache
    const localKey = `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const rosters: UserRoster[] = JSON.parse(raw);
      const filtered = rosters.filter((r) => r.user_name.toUpperCase() !== cleanName);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
    localStorage.removeItem(`pixel_pros_roster_${cleanRoom}_${cleanName}`);
    localStorage.removeItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`);

    // 2. Delete from Supabase
    await supabase
      .from('user_rosters')
      .delete()
      .eq('room_code', cleanRoom)
      .eq('user_name', cleanName);

    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: { room_code: cleanRoom, user_name: cleanName, deleted: true } }));
    return true;
  } catch (err) {
    console.warn('deleteUserRoster error:', err);
    return false;
  }
}

/**
 * Subscribes to Realtime Postgres changes specifically for a room's user_rosters.
 * Instant zero-lag sync across multiple devices in the room.
 */
export function subscribeToRoomRosters(roomCode: string, onUpdate: () => void) {
  const clean = (roomCode || 'COUCH').trim().toUpperCase();
  const channel = supabase
    .channel(`room-${clean}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_rosters',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to Realtime Postgres changes on competitors, matches, and user_rosters.
 * Zero polling, zero page reloads — numbers flip instantly on write.
 */
export function subscribeToRealtimeScores(
  onCompetitorUpdate: (payload: any) => void,
  onMatchUpdate?: (payload: any) => void,
  onRosterUpdate?: (payload: any) => void
) {
  const channel = supabase
    .channel('pixel-pros-realtime-wire')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'competitors',
      },
      (payload) => {
        onCompetitorUpdate(payload);
      }
    );

  if (onMatchUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
      },
      (payload) => {
        onMatchUpdate(payload);
      }
    );
  }

  if (onRosterUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_rosters',
      },
      (payload) => {
        onRosterUpdate(payload);
      }
    );
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('⚡ Supabase Realtime Wire Connected: competitors, matches, user_rosters');
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
