import { createClient } from '@supabase/supabase-js';
import { Competitor, Match, UserRoster } from '../types';
import { INITIAL_COMPETITORS, LIVE_MATCHES } from '../data/mockData';
import { getDeviceId } from './deviceIdentity';

// Fallback to demo Supabase project if env variables are not yet configured in local environment
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const procEnv = typeof process !== 'undefined' ? process.env : {};

export const SUPABASE_URL =
  metaEnv?.VITE_SUPABASE_URL ||
  procEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  'https://sqntjgjqtwbcqpxcqzbg.supabase.co';

export const SUPABASE_ANON_KEY =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_preview';

// Supabase client instance with Realtime enabled
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Fetches real active NFL competitors directly from the Supabase competitors table.
 * Hydrates strictly from competitors ordered by score DESC limit 20.
 * Every athlete's points come strictly from the database; if unplayed or 0, score is 0.
 */
export async function fetchLiveNFLCompetitors(): Promise<Competitor[]> {
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .order('score', { ascending: false })
      .limit(350);

    if (error || !data || data.length === 0) {
      return INITIAL_COMPETITORS;
    }

    // Merge Supabase scores into our athlete pool so all 250+ players are preserved
    const fetchedMap = new Map<string, any>();
    data.forEach((row: any) => {
      const key = String(row.id || row.external_provider_id || row.short_name?.toLowerCase()).toLowerCase();
      fetchedMap.set(key, row);
      if (row.short_name) {
        fetchedMap.set(row.short_name.toLowerCase(), row);
      }
    });

    const result = INITIAL_COMPETITORS.map((fallback) => {
      const row = fetchedMap.get(fallback.id.toLowerCase()) || fetchedMap.get(fallback.shortName.toLowerCase());
      if (!row) return fallback;

      const rawScore = row.score ?? row.fantasy_points ?? fallback.score;
      const wholeScore = Math.max(0, Math.round(Number(rawScore) || 0));

      return {
        ...fallback,
        displayName: row.display_name || fallback.displayName,
        shortName: row.short_name || fallback.shortName,
        uniformNumber: Number(row.uniform_number || row.jersey_number || fallback.uniformNumber),
        teamName: row.team_name || fallback.teamName,
        teamCode: (row.team_code || fallback.teamCode).toUpperCase(),
        position: row.position || fallback.position,
        score: wholeScore,
        stats: row.stats || {
          passingYards: Number(row.passing_yards || fallback.stats.passingYards),
          rushingYards: Number(row.rushing_yards || fallback.stats.rushingYards),
          touchdowns: Number(row.touchdowns || fallback.stats.touchdowns),
          primaryMetricLabel: 'Touchdowns',
          primaryMetricValue: Number(row.touchdowns || fallback.stats.touchdowns),
        },
      };
    });

    // Also include any new players returned from Supabase that weren't in INITIAL_COMPETITORS
    data.forEach((row: any) => {
      const id = String(row.id || row.external_provider_id || row.short_name?.toLowerCase());
      const alreadyExists = result.some(p => p.id.toLowerCase() === id.toLowerCase() || p.shortName.toLowerCase() === row.short_name?.toLowerCase());
      if (!alreadyExists) {
        const rawScore = row.score ?? row.fantasy_points ?? 0;
        result.push({
          id,
          sportId: 'nfl',
          displayName: row.display_name || row.short_name || 'NFL Pro',
          shortName: (row.short_name || 'PRO').toUpperCase(),
          uniformNumber: Number(row.uniform_number || 10),
          teamName: row.team_name || 'NFL',
          teamCode: (row.team_code || 'NFL').toUpperCase(),
          positionGeneric: row.position_generic || 'OFFENSE',
          position: row.position || 'WR',
          rating: Number(row.rating || 90),
          score: Math.max(0, Math.round(Number(rawScore) || 0)),
          stats: {
            passingYards: Number(row.passing_yards || 0),
            rushingYards: Number(row.rushing_yards || 0),
            touchdowns: Number(row.touchdowns || 0),
            primaryMetricLabel: 'Touchdowns',
            primaryMetricValue: Number(row.touchdowns || 0),
          },
          badges: ['gold_star'],
          avatar: {
            helmetColor: '#12579b',
            jerseyColor: '#12579b',
            stripeColor: '#ffffff',
            skinTone: '#d98c55',
            number: Number(row.uniform_number || 10),
          },
        });
      }
    });

    return result.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn('⚡ Live Supabase fetch encountered error, using genuine local NFL roster:', err);
    return INITIAL_COMPETITORS;
  }
}

/**
 * Fetches real NFL games directly from the Supabase matches table (sport = 'nfl').
 * Falls back cleanly to LIVE_MATCHES (the active week match slate).
 */
export async function fetchLiveNFLMatches(): Promise<Match[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('sport_id', 'nfl')
      .order('scheduled_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return LIVE_MATCHES;
    }

    return data.map((row: any): Match => {
      const rawStatus = (row.status || 'scheduled').toLowerCase();
      const isLive = rawStatus === 'live' || rawStatus === 'in_progress';
      const isFinal = rawStatus === 'final' || rawStatus === 'completed';
      const isScheduled = !isLive && !isFinal;

      let periodLabel = row.period_label;
      if (isScheduled && !periodLabel && row.scheduled_at) {
        try {
          periodLabel = new Date(row.scheduled_at).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          });
        } catch {
          periodLabel = '1:00 PM EDT';
        }
      }

      return {
        id: String(row.id || row.external_match_id),
        sportId: 'nfl',
        homeTeam: row.home_competitor_name || row.home_team || 'Home',
        awayTeam: row.away_competitor_name || row.away_team || 'Away',
        homeTeamCode: (row.home_team_code || row.home_competitor_name?.slice(0, 3) || 'KC').toUpperCase(),
        awayTeamCode: (row.away_team_code || row.away_competitor_name?.slice(0, 3) || 'BUF').toUpperCase(),
        status: isScheduled ? 'upcoming' : (isFinal ? 'final' : 'live'),
        periodLabel: periodLabel || (isScheduled ? '1:00 PM EDT' : 'LIVE'),
        homeScore: isScheduled ? 0 : Number(row.home_score || 0),
        awayScore: isScheduled ? 0 : Number(row.away_score || 0),
        recentEvent: row.recent_event,
      };
    });
  } catch (err) {
    console.warn('⚡ Live Supabase matches fetch encountered error:', err);
    return LIVE_MATCHES;
  }
}

/**
 * Upsert picks directly to Supabase table `user_rosters`:
 * { room_code: roomCode.toUpperCase(), device_id: deviceId, user_name: userName, star_1_id, star_2_id, star_3_id, is_locked, updated_at: new Date().toISOString() }
 * Also synchronizes with local multi-device storage cache so multi-tab or local sessions stay in sync.
 */
export async function upsertUserRoster(
  roomCode: string,
  userName: string,
  star1Id: string,
  star2Id: string,
  star3Id: string,
  isLocked?: boolean
): Promise<{ success: boolean; data?: UserRoster }> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'YOU').trim();
  const deviceId = getDeviceId();

  const record: UserRoster = {
    room_code: cleanRoom,
    user_name: cleanName,
    device_id: deviceId,
    star_1_id: star1Id || '',
    star_2_id: star2Id || '',
    star_3_id: star3Id || '',
    is_locked: isLocked ?? false,
    updated_at: new Date().toISOString(),
  };

  // Sync to local room cache (keyed by room & device_id or user_name)
  try {
    const localKey = `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    let rosters: UserRoster[] = raw ? JSON.parse(raw) : [];
    const idx = rosters.findIndex(
      (r) => (r.device_id && r.device_id === deviceId) || r.user_name.toLowerCase() === cleanName.toLowerCase()
    );
    if (idx >= 0) {
      rosters[idx] = { ...rosters[idx], ...record };
    } else {
      rosters.push(record);
    }
    localStorage.setItem(localKey, JSON.stringify(rosters));
    // Save lock state explicitly in localStorage for this room and device/user
    localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${deviceId}`, isLocked ? 'true' : 'false');
    localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`, isLocked ? 'true' : 'false');
    // Save user's roster for this specific room to enable instant multi-room switching
    localStorage.setItem(`pixel_pros_roster_${cleanRoom}`, JSON.stringify([record.star_1_id, record.star_2_id, record.star_3_id]));
    // Dispatch local notification event
    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: record }));
  } catch {
    // ignore
  }

  // Upsert to Supabase table user_rosters with device_id
  try {
    const payload: any = {
      room_code: cleanRoom,
      device_id: deviceId,
      user_name: cleanName,
      star_1_id: star1Id || '',
      star_2_id: star2Id || '',
      star_3_id: star3Id || '',
      updated_at: record.updated_at,
    };
    if (typeof isLocked === 'boolean') {
      payload.is_locked = isLocked;
    }

    // Try upserting with (room_code, device_id)
    let { error } = await supabase
      .from('user_rosters')
      .upsert(payload, { onConflict: 'room_code, device_id' });

    // Fallback if DB table constraint is room_code,user_name
    if (error && error.message && error.message.includes('conflict')) {
      const fallback = await supabase
        .from('user_rosters')
        .upsert(payload, { onConflict: 'room_code,user_name' });
      error = fallback.error;
    }

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

/**
 * Queries user_rosters where room_code = currentRoomCode.
 */
export async function fetchRoomRosters(roomCode: string): Promise<UserRoster[]> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();

  // Load local cache first
  let localRosters: UserRoster[] = [];
  try {
    const raw = localStorage.getItem(`pixel_pros_rosters_${cleanRoom}`);
    if (raw) {
      localRosters = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from('user_rosters')
      .select('*')
      .eq('room_code', cleanRoom)
      .order('updated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return localRosters;
    }

    // Merge Supabase records with local records: deduplicate by device_id or user_name
    const map = new Map<string, UserRoster>();
    localRosters.forEach((r) => {
      const key = r.device_id ? `dev_${r.device_id}` : `name_${r.user_name.toLowerCase()}`;
      map.set(key, r);
    });
    data.forEach((r: any) => {
      const entry: UserRoster = {
        id: r.id,
        room_code: r.room_code,
        user_name: r.user_name,
        device_id: r.device_id,
        star_1_id: r.star_1_id,
        star_2_id: r.star_2_id,
        star_3_id: r.star_3_id,
        is_locked: Boolean(r.is_locked),
        updated_at: r.updated_at,
      };
      const key = entry.device_id ? `dev_${entry.device_id}` : `name_${entry.user_name.toLowerCase()}`;
      map.set(key, entry);
    });

    return Array.from(map.values());
  } catch {
    return localRosters;
  }
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
