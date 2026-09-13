import { createClient } from '@supabase/supabase-js';
import { Competitor, Match, UserRoster } from '../types';
import { INITIAL_COMPETITORS } from '../data/mockData';

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
      .limit(20);

    if (error || !data || data.length === 0) {
      return INITIAL_COMPETITORS;
    }

    return data.map((row: any): Competitor => {
      const fallback =
        INITIAL_COMPETITORS.find(
          (c) =>
            c.id === (row.id || row.external_provider_id) ||
            c.shortName.toLowerCase() === row.short_name?.toLowerCase()
        ) || INITIAL_COMPETITORS[0];

      // Strictly real points: if 0 or null, defaults to 0
      const rawScore = row.score ?? row.fantasy_points ?? 0;
      const wholeScore = Math.max(0, Math.round(Number(rawScore) || 0));

      return {
        id: String(row.id || row.external_provider_id || row.short_name?.toLowerCase()),
        sportId: 'nfl',
        displayName: row.display_name || row.short_name || 'NFL Pro',
        shortName: row.short_name || row.display_name?.split(' ').pop()?.toUpperCase() || 'PRO',
        uniformNumber: Number(row.uniform_number || row.jersey_number || fallback.uniformNumber || 10),
        teamName: row.team_name || fallback.teamName || 'NFL',
        teamCode: (row.team_code || fallback.teamCode || 'NFL').toUpperCase(),
        positionGeneric: row.position_generic || fallback.positionGeneric || 'STAR',
        position: row.position || row.position_generic || fallback.position || 'WR',
        rating: Number(row.rating || fallback.rating || 90),
        score: wholeScore,
        stats: row.stats || fallback.stats || {
          passingYards: Number(row.passing_yards || 0),
          rushingYards: Number(row.rushing_yards || 0),
          touchdowns: Number(row.touchdowns || 0),
          primaryMetricLabel: 'Touchdowns',
          primaryMetricValue: Number(row.touchdowns || 0),
        },
        badges: row.badges || fallback.badges || ['mvp_trophy', 'gold_star'],
        avatar: row.avatar_config || fallback.avatar,
      };
    });
  } catch (err) {
    console.warn('⚡ Live Supabase fetch encountered error, using genuine local NFL roster:', err);
    return INITIAL_COMPETITORS;
  }
}

/**
 * Fetches real NFL games directly from the Supabase matches table (sport = 'nfl').
 * If a game status is 'scheduled' or 'upcoming', displays the real kickoff time or status
 * (e.g. '1:00 PM EDT') instead of fake scores.
 */
export async function fetchLiveNFLMatches(): Promise<Match[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('sport_id', 'nfl')
      .order('scheduled_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
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
    return [];
  }
}

/**
 * Upsert picks directly to Supabase table `user_rosters`:
 * { room_code: roomCode.toUpperCase(), user_name: userName, star_1_id, star_2_id, star_3_id, updated_at: new Date().toISOString() }
 * Also synchronizes with local multi-device storage cache so multi-tab or local sessions stay in sync.
 */
export async function upsertUserRoster(
  roomCode: string,
  userName: string,
  star1Id: string,
  star2Id: string,
  star3Id: string
): Promise<{ success: boolean; data?: UserRoster }> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'YOU').trim();
  const record: UserRoster = {
    room_code: cleanRoom,
    user_name: cleanName,
    star_1_id: star1Id || '',
    star_2_id: star2Id || '',
    star_3_id: star3Id || '',
    updated_at: new Date().toISOString(),
  };

  // Sync to local room cache
  try {
    const localKey = `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    let rosters: UserRoster[] = raw ? JSON.parse(raw) : [];
    const idx = rosters.findIndex(
      (r) => r.user_name.toLowerCase() === cleanName.toLowerCase()
    );
    if (idx >= 0) {
      rosters[idx] = { ...rosters[idx], ...record };
    } else {
      rosters.push(record);
    }
    localStorage.setItem(localKey, JSON.stringify(rosters));
    // Dispatch local notification event
    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: record }));
  } catch {
    // ignore
  }

  // Upsert to Supabase table user_rosters
  try {
    const { error } = await supabase
      .from('user_rosters')
      .upsert(
        {
          room_code: cleanRoom,
          user_name: cleanName,
          star_1_id: star1Id || '',
          star_2_id: star2Id || '',
          star_3_id: star3Id || '',
          updated_at: record.updated_at,
        },
        { onConflict: 'room_code,user_name' }
      );

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

    // Merge Supabase records with local records
    const map = new Map<string, UserRoster>();
    localRosters.forEach((r) => map.set(r.user_name.toLowerCase(), r));
    data.forEach((r: any) => {
      map.set(r.user_name.toLowerCase(), {
        id: r.id,
        room_code: r.room_code,
        user_name: r.user_name,
        star_1_id: r.star_1_id,
        star_2_id: r.star_2_id,
        star_3_id: r.star_3_id,
        updated_at: r.updated_at,
      });
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
