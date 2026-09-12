export const SUPABASE_CONFIG = {
  url: "https://sqntjgjqtwbcqpxcqzbg.supabase.co",
  projectId: "sqntjgjqtwbcqpxcqzbg",
};

export const UNIVERSAL_POSTGRES_SCHEMA = `-- =========================================================================
-- PIXEL PROS: FOUNDATIONAL POSTGRESQL UNIVERSAL DATA SCHEMA (SUPABASE)
-- Designed for Sports-Agnostic Fantasy Game Engine with Whole-Number Scoring
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SPORTS REGISTRY (Sport-Agnostic Meta Table)
CREATE TABLE IF NOT EXISTS public.sports (
    id TEXT PRIMARY KEY,                       -- e.g. 'nfl', 'nba', 'soccer', 'tennis'
    name TEXT NOT NULL,                        -- 'Football', 'Basketball', 'Soccer'
    icon_name TEXT NOT NULL,                   -- 'football', 'basketball'
    season_label TEXT NOT NULL DEFAULT '2026 Week 1',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. UNIVERSAL COMPETITORS (Players / Athletes across all sports)
CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    external_provider_id TEXT,                 -- ESPN athlete ID for lightweight mapping
    display_name TEXT NOT NULL,                -- e.g. 'Patrick Mahomes'
    short_name TEXT NOT NULL,                  -- e.g. 'MAHOMES'
    uniform_number INTEGER NOT NULL DEFAULT 88,
    team_name TEXT NOT NULL,                   -- e.g. 'Kansas City'
    team_code TEXT NOT NULL,                   -- e.g. 'KC'
    position_generic TEXT NOT NULL,            -- 'OFFENSE', 'DEFENSE', 'SCORER', 'PLAYMAKER'
    rating INTEGER NOT NULL DEFAULT 85,        -- Retro card rating (80-99)
    avatar_config JSONB NOT NULL DEFAULT '{
      "helmetColor": "#155e9e",
      "jerseyColor": "#155e9e",
      "stripeColor": "#ffffff",
      "skinTone": "#d98c55",
      "number": 88
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy sport and team querying
CREATE INDEX IF NOT EXISTS idx_competitors_sport ON public.competitors(sport_id);
CREATE INDEX IF NOT EXISTS idx_competitors_external_id ON public.competitors(external_provider_id);

-- 3. UNIVERSAL MATCHES (Games / Fixtures across all sports)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    external_match_id TEXT,                    -- ESPN gameId
    home_competitor_name TEXT NOT NULL,        -- e.g. 'Chiefs'
    away_competitor_name TEXT NOT NULL,        -- e.g. 'Bills'
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming',   -- 'upcoming', 'live', 'final'
    period_label TEXT NOT NULL DEFAULT 'Pre-Game', -- 'Q3 04:12', 'Halftime', 'Final'
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_sport_status ON public.matches(sport_id, status);

-- 4. SCORING RULES ENGINE (Whole-Number Math for Kids)
-- Tweakable on-the-fly per sport without altering frontend code!
CREATE TABLE IF NOT EXISTS public.scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,                  -- 'touchdown', 'field_goal', 'soccer_goal', 'basket_3pt'
    display_name TEXT NOT NULL,                -- 'Touchdown', 'Field Goal', 'Goal'
    points_value INTEGER NOT NULL,             -- STRICTLY WHOLE NUMBER (e.g. 6, 3, 1)
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sport_event UNIQUE (sport_id, event_type)
);

-- 5. NORMALIZED MATCH EVENTS (Written by Python Ingestion Worker)
-- Stores generic 'stat_primary' metrics translated from raw provider APIs
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,                  -- 'touchdown', 'passing_tier', 'rushing_tier'
    stat_primary INTEGER NOT NULL DEFAULT 1,   -- 1 touchdown, 50 passing yards
    fantasy_points INTEGER NOT NULL DEFAULT 0, -- Computed whole-number points based on rule
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_events_competitor ON public.match_events(competitor_id);

-- 6. USER PROFILES & KIDS LOCKER ROOM
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,             -- e.g. 'PLAYER123', 'PIXELPRO'
    coins INTEGER NOT NULL DEFAULT 98765,      -- Retro arcade coins for unlocking helmets
    total_score INTEGER NOT NULL DEFAULT 14670,
    badges JSONB NOT NULL DEFAULT '["emerald_gem", "diamond_crystal"]'::jsonb,
    avatar_config JSONB NOT NULL DEFAULT '{
      "helmetColor": "#155e9e",
      "jerseyColor": "#155e9e",
      "stripeColor": "#ffffff",
      "skinTone": "#d98c55",
      "number": 88
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FANTASY ROSTERS (The 3-Player Lineup per Week)
CREATE TABLE IF NOT EXISTS public.rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    period_code TEXT NOT NULL DEFAULT 'WEEK_CURRENT',
    competitor_slot_1 UUID REFERENCES public.competitors(id),
    competitor_slot_2 UUID REFERENCES public.competitors(id),
    competitor_slot_3 UUID REFERENCES public.competitors(id),
    total_points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_sport_period UNIQUE (user_id, sport_id, period_code)
);

-- 8. ROW LEVEL SECURITY (RLS) FOR SAFE KIDS APPLICATION
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;

-- Public read policies so the React client can query game state securely
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read competitors" ON public.competitors FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read scoring_rules" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "Public read match_events" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "Public read user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read rosters" ON public.rosters FOR SELECT USING (true);

-- 9. INITIAL SEED DATA FOR NFL, NBA, SOCCER
INSERT INTO public.sports (id, name, icon_name, season_label) VALUES
('nfl', 'Football', 'football', 'Week 2'),
('nba', 'Basketball', 'basketball', 'Regular Season'),
('soccer', 'Soccer', 'soccer', 'Matchday 5')
ON CONFLICT (id) DO NOTHING;

-- Seed Simple Whole-Number Scoring Rules
INSERT INTO public.scoring_rules (sport_id, event_type, display_name, points_value, description) VALUES
('nfl', 'touchdown', 'Touchdown', 6, 'Six whole points for every touchdown!'),
('nfl', 'field_goal', 'Field Goal', 3, 'Three points for field goals'),
('nfl', 'safety', 'Safety / Defense', 2, 'Two points for defensive stops'),
('nfl', 'pass_50yds', 'Pass 50 Yards', 1, 'One whole point per 50 passing yards'),
('nba', 'basket_3pt', '3-Pointer', 3, 'Three whole points for a long-distance basket'),
('nba', 'dunk', 'Slam Dunk', 2, 'Two whole points for inside baskets'),
('soccer', 'goal', 'Goal Scored', 1, 'One point per goal - simple and clean')
ON CONFLICT (sport_id, event_type) DO NOTHING;
`;

export const PYTHON_INGESTOR_CODE = `"""
Pixel Pros Universal Data Ingestor (Python)
------------------------------------------------
Polls raw sports feeds (ESPN / Sportradar), normalizes statistics
into generic 'stat_primary' metrics, and upserts into Supabase.
Frontend NEVER touches third-party APIs directly!
"""

import os
import requests
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sqntjgjqtwbcqpxcqzbg.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ESPN NFL Scoreboard endpoint (free / public)
ESPN_NFL_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"

def normalize_stat(raw_stat_name: str, raw_value: int) -> tuple[str, int, int]:
    """
    Translates messy sport-specific stats into the universal format:
    Returns (event_type, stat_primary, points_awarded)
    Always computes whole-number points for kids!
    """
    if raw_stat_name == "passingTouchdowns":
        return ("touchdown", raw_value, raw_value * 6)
    elif raw_stat_name == "rushingTouchdowns":
        return ("touchdown", raw_value, raw_value * 6)
    elif raw_stat_name == "passingYards":
        # 1 whole point per 50 yards (no fractional decimals)
        return ("passing_tier", raw_value, raw_value // 50)
    elif raw_stat_name == "goals":
        return ("soccer_goal", raw_value, raw_value * 1)
    return ("stat_other", raw_value, 0)

def ingest_live_events():
    print("Fetching live data from ESPN...")
    res = requests.get(ESPN_NFL_URL, timeout=10)
    data = res.json()
    
    for event in data.get("events", []):
        match_id = event.get("id")
        status = event.get("status", {}).get("type", {}).get("state", "upcoming")
        period = event.get("status", {}).get("type", {}).get("detail", "Pre-Game")
        
        # 1. Upsert match into universal table
        competitions = event.get("competitions", [{}])[0]
        competitors = competitions.get("competitors", [])
        if len(competitors) >= 2:
            home = competitors[0].get("team", {}).get("displayName")
            away = competitors[1].get("team", {}).get("displayName")
            home_score = int(competitors[0].get("score", 0))
            away_score = int(competitors[1].get("score", 0))
            
            supabase.table("matches").upsert({
                "external_match_id": match_id,
                "sport_id": "nfl",
                "home_competitor_name": home,
                "away_competitor_name": away,
                "status": "live" if status == "in" else ("final" if status == "post" else "upcoming"),
                "period_label": period,
                "home_score": home_score,
                "away_score": away_score
            }, on_conflict="external_match_id").execute()

    print("Live ingestion sync complete!")

if __name__ == "__main__":
    ingest_live_events()
`;

export const DUMMY_SEED_SQL = `-- =========================================================================
-- PIXEL PROS: DUMMY SEED DATA FOR SUPABASE
-- Run this in your Supabase SQL Editor (https://sqntjgjqtwbcqpxcqzbg.supabase.co)
-- =========================================================================

-- 1. Ensure sport 'nfl' exists
INSERT INTO public.sports (id, name, icon_name, season_label)
VALUES ('nfl', 'Football', 'football', '2026 Week 1')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 6 8-Bit Competitors matching the pixel roster UI cards
INSERT INTO public.competitors (id, sport_id, display_name, short_name, uniform_number, team_name, team_code, position_generic, rating, avatar_config)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 'nfl', 'Josh Allen', 'JOSH', 17, 'Buffalo', 'BUF', 'OFFENSE', 85,
    '{"helmetColor": "#155e9e", "jerseyColor": "#155e9e", "stripeColor": "#ffffff", "skinTone": "#d98c55", "number": 17}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222', 'nfl', 'Patrick Mahomes', 'MAHOMES', 15, 'Kansas City', 'KC', 'OFFENSE', 85,
    '{"helmetColor": "#b91c1c", "jerseyColor": "#b91c1c", "stripeColor": "#ffffff", "skinTone": "#bb763e", "number": 15}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333', 'nfl', 'Tyreek Hill', 'TYREEK', 10, 'Miami', 'MIA', 'OFFENSE', 85,
    '{"helmetColor": "#0d9488", "jerseyColor": "#0d9488", "stripeColor": "#ffffff", "skinTone": "#78350f", "number": 10}'::jsonb
  ),
  (
    '44444444-4444-4444-4444-444444444444', 'nfl', 'George Kittle', 'GILF', 85, 'San Francisco', 'SF', 'OFFENSE', 81,
    '{"helmetColor": "#991b1b", "jerseyColor": "#991b1b", "stripeColor": "#ffffff", "skinTone": "#f1a876", "number": 85}'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555555', 'nfl', 'Derrick Henry', 'HENRY', 22, 'Baltimore', 'BAL', 'OFFENSE', 86,
    '{"helmetColor": "#4338ca", "jerseyColor": "#4338ca", "stripeColor": "#ffffff", "skinTone": "#602c0b", "number": 22}'::jsonb
  ),
  (
    '66666666-6666-6666-6666-666666666666', 'nfl', 'Jeerice Henry', 'JEERICE', 88, 'Retro All-Stars', 'RET', 'OFFENSE', 88,
    '{"helmetColor": "#155e9e", "jerseyColor": "#155e9e", "stripeColor": "#ffffff", "skinTone": "#d98c55", "number": 88}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  short_name = EXCLUDED.short_name,
  uniform_number = EXCLUDED.uniform_number,
  rating = EXCLUDED.rating;

-- 3. Insert user profile for PLAYER123
INSERT INTO public.user_profiles (id, username, coins, total_score, badges, avatar_config)
VALUES (
  'd0e5b720-3021-4d7a-8b1b-9f939e081111',
  'PLAYER123',
  98765,
  14670,
  '["emerald_gem", "diamond_crystal"]'::jsonb,
  '{"helmetColor": "#155e9e", "jerseyColor": "#155e9e", "stripeColor": "#ffffff", "skinTone": "#d98c55", "number": 88}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  coins = EXCLUDED.coins,
  total_score = EXCLUDED.total_score;

-- 4. Insert active 3-player lineup for PLAYER123:
-- Slot 1: Josh (#17), Slot 2: Mahomes (#15), Slot 3: Jeerice (#88)
INSERT INTO public.rosters (id, user_id, sport_id, period_code, competitor_slot_1, competitor_slot_2, competitor_slot_3, total_points)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'd0e5b720-3021-4d7a-8b1b-9f939e081111',
  'nfl',
  'WEEK_CURRENT',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  1852
)
ON CONFLICT (user_id, sport_id, period_code) DO UPDATE SET
  competitor_slot_1 = EXCLUDED.competitor_slot_1,
  competitor_slot_2 = EXCLUDED.competitor_slot_2,
  competitor_slot_3 = EXCLUDED.competitor_slot_3,
  total_points = EXCLUDED.total_points;
`;

export const NEXTJS_ENV_SETUP = `# =========================================================================
# VERCEL & NEXT.JS ENVIRONMENT VARIABLES (.env.local)
# =========================================================================

# 1. PUBLIC CLIENT VARIABLES (Exposed to the browser safely via RLS)
# In Next.js, variables prefixed with NEXT_PUBLIC_ are bundled into client code.
# Safe because Supabase enforces PostgreSQL Row Level Security (RLS) rules!
NEXT_PUBLIC_SUPABASE_URL=https://sqntjgjqtwbcqpxcqzbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key

# 2. PRIVATE SERVER VARIABLES (NEVER prefix with NEXT_PUBLIC_)
# Only accessible on the server in Next.js Server Components, Route Handlers,
# or Python workers. Bypasses RLS - keep strictly hidden in Vercel settings!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

# 3. HOW TO CONFIGURE IN VERCEL:
# 1. Go to your Vercel Project Dashboard -> Settings -> Environment Variables
# 2. Add NEXT_PUBLIC_SUPABASE_URL (select Production, Preview, Development)
# 3. Add NEXT_PUBLIC_SUPABASE_ANON_KEY (select Production, Preview, Development)
# 4. Add SUPABASE_SERVICE_ROLE_KEY (select Production, Preview, Development)
# 5. Redeploy your Vercel project!
`;

export const NEXTJS_SUPABASE_CLIENT_CODE = `// lib/supabase/client.ts
// Browser Client for Next.js App Router
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;

export const NEXTJS_SUPABASE_SERVER_CODE = `// lib/supabase/server.ts
// Server Client for Next.js App Router (Server Components & Server Actions)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Read-only context in Server Components
          }
        },
      },
    }
  );
}
`;

export const NEXTJS_PAGE_CODE = `// app/my-team/page.tsx
// Next.js App Router Server Component
// Fetches the user's 3-player lineup directly from Supabase on the server
import { createClient } from '@/lib/supabase/server';
import { MyTeamView } from '@/components/MyTeamView';

// Revalidate on demand or every 60s for live games
export const revalidate = 60;

export default async function MyTeamPage() {
  const supabase = await createClient();

  // Current user ID (from Supabase Auth session or demo user)
  const userId = 'd0e5b720-3021-4d7a-8b1b-9f939e081111';

  // 1. Fetch User Profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // 2. Fetch User's Active Weekly Roster Lineup
  const { data: rosterRow } = await supabase
    .from('rosters')
    .select('*')
    .eq('user_id', userId)
    .eq('sport_id', 'nfl')
    .eq('period_code', 'WEEK_CURRENT')
    .single();

  // 3. Fetch All Available Competitors for the Roster Card Pool
  const { data: allCompetitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('sport_id', 'nfl')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  // 4. Map the 3 Slot Foreign Keys (slot_1, slot_2, slot_3) to Competitor objects
  const slotIds = [
    rosterRow?.competitor_slot_1,
    rosterRow?.competitor_slot_2,
    rosterRow?.competitor_slot_3,
  ].filter(Boolean);

  // Selected 3 players to render inside the 'My Team' 8-bit lineup slots!
  const selectedPlayers = (allCompetitors || []).filter(c =>
    slotIds.includes(c.id)
  );

  return (
    <main className="min-h-screen football-field py-8 px-4 sm:px-6">
      <MyTeamView
        user={userProfile}
        roster={allCompetitors || []}
        selectedPlayers={selectedPlayers}
      />
    </main>
  );
}
`;

export const NEXTJS_HOOK_CODE = `// hooks/useSupabaseRoster.ts
// Client-side React hook for interactive toggling & live slot updating
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupabaseRoster(userId: string) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [allCompetitors, setAllCompetitors] = useState<any[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<(string | null)[]>([null, null, null]);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch user profile
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (userData) setUser(userData);

    // 2. Fetch all competitors
    const { data: comps } = await supabase
      .from('competitors')
      .select('*')
      .eq('sport_id', 'nfl')
      .order('rating', { ascending: false });
    if (comps) setAllCompetitors(comps);

    // 3. Fetch current roster row
    const { data: roster } = await supabase
      .from('rosters')
      .select('competitor_slot_1, competitor_slot_2, competitor_slot_3')
      .eq('user_id', userId)
      .eq('sport_id', 'nfl')
      .eq('period_code', 'WEEK_CURRENT')
      .single();

    if (roster) {
      setSelectedSlotIds([
        roster.competitor_slot_1,
        roster.competitor_slot_2,
        roster.competitor_slot_3,
      ]);
    }

    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update a specific slot (1, 2, or 3) when a kid clicks a player card
  const assignSlot = async (slotIndex: 0 | 1 | 2, competitorId: string | null) => {
    const slotColumn = \`competitor_slot_\${slotIndex + 1}\`;
    
    // Optimistic UI update
    setSelectedSlotIds(prev => {
      const next = [...prev];
      next[slotIndex] = competitorId;
      return next;
    });

    // Write to Supabase table
    const { error } = await supabase
      .from('rosters')
      .upsert({
        user_id: userId,
        sport_id: 'nfl',
        period_code: 'WEEK_CURRENT',
        [slotColumn]: competitorId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,sport_id,period_code' });

    if (error) {
      console.error('Failed to sync slot with Supabase:', error);
      loadData(); // Revert on failure
    }
  };

  // Resolved Competitor objects for the 3 active lineup slots
  const selectedPlayers = selectedSlotIds
    .map(id => allCompetitors.find(c => c.id === id))
    .filter(Boolean);

  return {
    loading,
    user,
    allCompetitors,
    selectedSlotIds,
    selectedPlayers,
    assignSlot,
    refresh: loadData,
  };
}
`;
