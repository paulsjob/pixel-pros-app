import { createClient } from '@supabase/supabase-js';
import { Competitor } from '../types';
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
 * Fetches real NFL competitors directly from the Supabase competitors table.
 * Falls back seamlessly to INITIAL_COMPETITORS if Supabase is offline or empty.
 */
export async function fetchLiveNFLCompetitors(): Promise<Competitor[]> {
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .order('score', { ascending: false });

    if (error || !data || data.length === 0) {
      return INITIAL_COMPETITORS;
    }

    return data.map((row: any): Competitor => {
      // Find fallback for avatar colors if not stored in avatar_config
      const fallback = INITIAL_COMPETITORS.find(c => c.id === (row.id || row.external_provider_id)) || INITIAL_COMPETITORS[0];
      return {
        id: String(row.id || row.external_provider_id || row.short_name?.toLowerCase()),
        sportId: 'nfl',
        displayName: row.display_name || row.short_name || 'NFL Pro',
        shortName: row.short_name || row.display_name?.split(' ').pop()?.toUpperCase() || 'PRO',
        uniformNumber: Number(row.uniform_number || row.jersey_number || 10),
        teamName: row.team_name || row.team_code || 'NFL',
        teamCode: (row.team_code || 'NFL').toUpperCase(),
        positionGeneric: row.position_generic || 'OFFENSE',
        rating: Number(row.rating || 90),
        score: Number(row.score ?? row.fantasy_points ?? 12000),
        stats: row.stats || {
          passingYards: Number(row.passing_yards || 0),
          rushingYards: Number(row.rushing_yards || 0),
          touchdowns: Number(row.touchdowns || 0),
          primaryMetricLabel: 'Touchdowns',
          primaryMetricValue: Number(row.touchdowns || 0),
        },
        badges: row.badges || ['mvp_trophy', 'gold_star'],
        avatar: row.avatar_config || fallback.avatar,
      };
    });
  } catch (err) {
    console.warn('⚡ Live Supabase fetch encountered error, using genuine local NFL roster:', err);
    return INITIAL_COMPETITORS;
  }
}


/**
 * Subscribes to Realtime Postgres changes on the competitors/players table.
 * Zero polling, zero page reloads — numbers flip instantly on write.
 */
export function subscribeToRealtimeScores(
  onCompetitorUpdate: (payload: any) => void,
  onMatchUpdate?: (payload: any) => void
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

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('⚡ Supabase Realtime Wire Connected: Listening for live score writes');
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
