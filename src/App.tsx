import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_COMPETITORS,
  INITIAL_USER,
  LIVE_MATCHES,
} from './data/mockData';
import { Competitor, UserProfile, Match, UserRoster, ActiveSlot, SquadSlots } from './types';
import {
  subscribeToRealtimeScores,
  fetchLiveNFLCompetitors,
  fetchLiveNFLMatches,
  upsertUserRoster,
  fetchRoomRosters,
} from './lib/supabaseClient';
import { getDeviceId } from './lib/deviceIdentity';
import { MyTeamView } from './components/MyTeamView';
import { LeaderboardView } from './components/LeaderboardView';
import { SimpleRulesView } from './components/SimpleRulesView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { PlayerPickerModal } from './components/PlayerPickerModal';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PixelHelmetIcon } from './components/PixelBadges';
import { Users, Trophy, Database, HelpCircle, X } from 'lucide-react';

const DEFAULT_STAR_IDS: Record<string, [string, string, string]> = {
  COUCH: ['mahomes', 'henry', 'lamb'],
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'squad' | 'couch'>('squad');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  
  // Room Code & User Name state
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('pixel_pros_user_name') || 'YOU';
    } catch {
      return 'YOU';
    }
  });

  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      return (localStorage.getItem('pixel_pros_room_code') || 'COUCH').toUpperCase();
    } catch {
      return 'COUCH';
    }
  });

  // Master NFL athletes and matches loaded from Supabase / mockData
  const [roster, setRoster] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [matches, setMatches] = useState<Match[]>(LIVE_MATCHES);
  const [roomRosters, setRoomRosters] = useState<UserRoster[]>([]);

  // Explicit 3-slot roster state: star1, star2, star3 (Can be null)
  const [squadSlots, setSquadSlots] = useState<{
    star1: Competitor | null;
    star2: Competitor | null;
    star3: Competitor | null;
  }>(() => {
    try {
      const activeRoom = (localStorage.getItem('pixel_pros_room_code') || 'COUCH').trim().toUpperCase();
      const saved = localStorage.getItem(`pixel_pros_roster_${activeRoom}`) || localStorage.getItem('pixel_pros_user_stars');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        if (Array.isArray(ids)) {
          const s1 = INITIAL_COMPETITORS.find((p) => p.id === ids[0]) || null;
          const s2 = INITIAL_COMPETITORS.find((p) => p.id === ids[1]) || null;
          const s3 = INITIAL_COMPETITORS.find((p) => p.id === ids[2]) || null;
          return { star1: s1, star2: s2, star3: s3 };
        }
      }
    } catch {
      // ignore
    }
    const d1 = INITIAL_COMPETITORS.find((p) => p.id === 'mahomes') || null;
    const d2 = INITIAL_COMPETITORS.find((p) => p.id === 'henry') || null;
    const d3 = INITIAL_COMPETITORS.find((p) => p.id === 'lamb') || null;
    return { star1: d1, star2: d2, star3: d3 };
  });

  // Track activeSlot ('star1' | 'star2' | 'star3') when tapping a slot
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

  // Lock Picks Engine State (persisted per room and device)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const cleanRoom = (localStorage.getItem('pixel_pros_room_code') || 'COUCH').trim().toUpperCase();
      const deviceId = getDeviceId();
      const cleanName = (localStorage.getItem('pixel_pros_user_name') || 'YOU').trim();
      return (
        localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${deviceId}`) === 'true' ||
        localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`) === 'true'
      );
    } catch {
      return false;
    }
  });

  // Modals state
  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [isDbDrawerOpen, setIsDbDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Sync picks directly to Supabase table user_rosters and localStorage
  const syncLineupToSupabase = useCallback(
    async (
      rCode: string,
      uName: string,
      slotsObj: { star1: Competitor | null; star2: Competitor | null; star3: Competitor | null },
      lockedFlag?: boolean
    ) => {
      const s1Id = slotsObj.star1 ? slotsObj.star1.id : '';
      const s2Id = slotsObj.star2 ? slotsObj.star2.id : '';
      const s3Id = slotsObj.star3 ? slotsObj.star3.id : '';
      const finalLocked = typeof lockedFlag === 'boolean' ? lockedFlag : isLocked;

      // Save room-specific roster to localStorage
      try {
        localStorage.setItem(`pixel_pros_roster_${rCode}`, JSON.stringify([s1Id, s2Id, s3Id]));
      } catch {
        // ignore
      }

      await upsertUserRoster(rCode, uName, s1Id, s2Id, s3Id, finalLocked);
      // Refresh room rosters
      const updated = await fetchRoomRosters(rCode);
      setRoomRosters(updated);
    },
    [isLocked]
  );

  // Switch Room Code (Loads saved roster for that room or seeds fresh)
  const handleCommitRoomCode = async (newCode: string) => {
    const clean = newCode.trim().toUpperCase() || 'COUCH';
    setRoomCode(clean);
    try {
      localStorage.setItem('pixel_pros_room_code', clean);
    } catch {
      // ignore
    }

    // Load lock state for this room
    const deviceId = getDeviceId();
    const cleanName = (userName || 'YOU').trim();
    const roomLocked =
      localStorage.getItem(`pixel_pros_picks_locked_${clean}_${deviceId}`) === 'true' ||
      localStorage.getItem(`pixel_pros_picks_locked_${clean}_${cleanName}`) === 'true';
    setIsLocked(roomLocked);

    // Load saved roster for this room, or check room_rosters in Supabase, or default
    let loadedSlots = { star1: null as Competitor | null, star2: null as Competitor | null, star3: null as Competitor | null };
    try {
      const savedRoster = localStorage.getItem(`pixel_pros_roster_${clean}`);
      if (savedRoster) {
        const ids: string[] = JSON.parse(savedRoster);
        if (Array.isArray(ids)) {
          loadedSlots = {
            star1: roster.find((p) => p.id === ids[0]) || null,
            star2: roster.find((p) => p.id === ids[1]) || null,
            star3: roster.find((p) => p.id === ids[2]) || null,
          };
        }
      } else if (clean === 'COUCH') {
        loadedSlots = {
          star1: roster.find((p) => p.id === 'mahomes') || null,
          star2: roster.find((p) => p.id === 'henry') || null,
          star3: roster.find((p) => p.id === 'lamb') || null,
        };
      }
    } catch {
      // ignore
    }

    setSquadSlots(loadedSlots);
    syncLineupToSupabase(clean, userName, loadedSlots, roomLocked);
    showToast(`Switched to room "${clean}"`);
  };

  // Commit User Name
  const handleCommitUserName = (newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setUserName(clean);
    try {
      localStorage.setItem('pixel_pros_user_name', clean);
    } catch {
      // ignore
    }
    syncLineupToSupabase(roomCode, clean, squadSlots, isLocked);
    showToast(`User name updated to ${clean}`);
  };

  // Assign an athlete STRICTLY into activeSlot ('star1' | 'star2' | 'star3')
  const handleAssignSlot = (player: Competitor, targetSlot: ActiveSlot) => {
    if (isLocked) {
      showToast('🔒 Lineup is LOCKED! Tap UNLOCK PICKS to make substitutions.');
      return;
    }

    setSquadSlots((prev) => {
      const next: SquadSlots = { ...prev };
      // If player is currently assigned in another slot, clear that slot to prevent duplicate player cards
      if (next.star1?.id === player.id && targetSlot !== 'star1') next.star1 = null;
      if (next.star2?.id === player.id && targetSlot !== 'star2') next.star2 = null;
      if (next.star3?.id === player.id && targetSlot !== 'star3') next.star3 = null;

      // Assign strictly to target slot
      next[targetSlot] = player;

      // Persist & sync
      syncLineupToSupabase(roomCode, userName, next, isLocked);
      return next;
    });

    const slotLabel = targetSlot === 'star1' ? 'STAR 1' : targetSlot === 'star2' ? 'STAR 2' : 'STAR 3';
    showToast(`★ ${player.displayName} (${player.teamCode}) assigned to ${slotLabel}!`);
  };

  // Clear a specific slot to null when [X] is clicked
  const handleClearSlot = (slotKey: ActiveSlot) => {
    if (isLocked) {
      showToast('🔒 Lineup is LOCKED! Tap UNLOCK PICKS to modify.');
      return;
    }

    setSquadSlots((prev) => {
      const next = { ...prev, [slotKey]: null };
      syncLineupToSupabase(roomCode, userName, next, isLocked);
      return next;
    });

    const slotLabel = slotKey === 'star1' ? 'STAR 1' : slotKey === 'star2' ? 'STAR 2' : 'STAR 3';
    showToast(`Cleared ${slotLabel} slot.`);
  };

  // Toggle Lock state
  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
    const cleanName = (userName || 'YOU').trim();
    const filledCount = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean).length;

    if (nextLocked && filledCount < 3) {
      showToast(`⚠️ Please select all 3 Stars before locking! (${filledCount}/3 picked)`);
      return;
    }

    setIsLocked(nextLocked);
    try {
      const deviceId = getDeviceId();
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${deviceId}`, String(nextLocked));
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`, String(nextLocked));
    } catch {
      // ignore
    }

    syncLineupToSupabase(cleanRoom, cleanName, squadSlots, nextLocked);

    if (nextLocked) {
      showToast('🔒 PICKS LOCKED: Lineup submitted to Room Leaderboard!');
    } else {
      showToast('🔓 PICKS UNLOCKED: Slot substitutions are now editable.');
    }
  };

  // 🏈 Live Data Hookup: Fetch real NFL athletes & real games directly from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadLiveSupabaseData() {
      try {
        const [athletes, liveMatches, initialRosters] = await Promise.all([
          fetchLiveNFLCompetitors(),
          fetchLiveNFLMatches(),
          fetchRoomRosters(roomCode),
        ]);
        if (isMounted) {
          if (athletes && athletes.length > 0) {
            setRoster(athletes);
            // Re-sync active squad objects with live scores
            setSquadSlots((prev) => ({
              star1: prev.star1 ? (athletes.find((a) => a.id === prev.star1?.id) || prev.star1) : null,
              star2: prev.star2 ? (athletes.find((a) => a.id === prev.star2?.id) || prev.star2) : null,
              star3: prev.star3 ? (athletes.find((a) => a.id === prev.star3?.id) || prev.star3) : null,
            }));
          }
          if (liveMatches && liveMatches.length > 0) {
            setMatches(liveMatches);
          }
          if (initialRosters) {
            setRoomRosters(initialRosters);
          }
        }
      } catch (err) {
        console.warn('Live Supabase data initialization:', err);
      }
    }
    loadLiveSupabaseData();
    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  // ⚡ Connect Realtime Wire: Subscribes to Supabase postgres_changes for competitors, matches, and user_rosters
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeScores(
      (competitorPayload) => {
        const updated = competitorPayload?.new as any;
        if (updated && (updated.id || updated.short_name)) {
          const statsObj = typeof updated.stats === 'object' && updated.stats ? updated.stats : {};
          const formatStats = (existingStats?: Record<string, any>) => {
            const passYds = Number(statsObj.pass_yds ?? updated.pass_yds ?? statsObj.passing_yards ?? statsObj.passingYards ?? existingStats?.pass_yds ?? existingStats?.passingYards ?? 0);
            const rushYds = Number(statsObj.rush_yds ?? updated.rush_yds ?? statsObj.rushing_yards ?? statsObj.rushingYards ?? existingStats?.rush_yds ?? existingStats?.rushingYards ?? 0);
            const recYds = Number(statsObj.rec_yds ?? updated.rec_yds ?? statsObj.receiving_yards ?? statsObj.receivingYards ?? existingStats?.rec_yds ?? existingStats?.receivingYards ?? 0);
            const tds = Number(statsObj.tds ?? updated.tds ?? statsObj.touchdowns ?? existingStats?.tds ?? existingStats?.touchdowns ?? 0);
            return {
              ...existingStats,
              ...statsObj,
              pass_yds: passYds,
              rush_yds: rushYds,
              rec_yds: recYds,
              tds: tds,
              passingYards: passYds,
              rushingYards: rushYds,
              receivingYards: recYds,
              touchdowns: tds,
            };
          };

          setRoster((prev) =>
            (prev || []).map((p) => {
              if (p.id === updated.id || p.shortName.toLowerCase() === (updated.short_name || '').toLowerCase()) {
                const newScore = Math.round(Number(updated.score ?? p.score) || 0);
                return {
                  ...p,
                  score: newScore,
                  stats: formatStats(p.stats),
                };
              }
              return p;
            })
          );
          setSquadSlots((prev) => {
            const updateItem = (p: Competitor | null) => {
              if (p && (p.id === updated.id || p.shortName.toLowerCase() === (updated.short_name || '').toLowerCase())) {
                const newScore = Math.round(Number(updated.score ?? p.score) || 0);
                return {
                  ...p,
                  score: newScore,
                  stats: formatStats(p.stats),
                };
              }
              return p;
            };
            return {
              star1: updateItem(prev.star1),
              star2: updateItem(prev.star2),
              star3: updateItem(prev.star3),
            };
          });
          setDetailedPlayer((prev) => {
            if (!prev) return prev;
            if (prev.id === updated.id || prev.shortName.toLowerCase() === (updated.short_name || '').toLowerCase()) {
              const newScore = Math.round(Number(updated.score ?? prev.score) || 0);
              return {
                ...prev,
                score: newScore,
                stats: formatStats(prev.stats),
              };
            }
            return prev;
          });
          showToast(`⚡ REALTIME: ${updated.short_name || 'Player'} updated to ${updated.score ?? 0} PTS!`);
        }
      },
      (matchPayload) => {
        const updatedMatch = matchPayload?.new as any;
        if (updatedMatch && updatedMatch.id) {
          setMatches((prev) => {
            const exists = (prev || []).some((m) => m.id === updatedMatch.id);
            if (exists) {
              return (prev || []).map((m) =>
                m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
              );
            }
            return [updatedMatch, ...(prev || [])];
          });
        }
      },
      (rosterPayload) => {
        const updatedRoster = rosterPayload?.new as any;
        if (updatedRoster && updatedRoster.room_code === roomCode.toUpperCase()) {
          fetchRoomRosters(roomCode).then(setRoomRosters);
          showToast(`⚡ ROOM UPDATE: ${updatedRoster.user_name} updated their 3 Stars!`);
        }
      }
    );

    const handleLocalRosterUpdate = () => {
      fetchRoomRosters(roomCode).then(setRoomRosters);
    };
    window.addEventListener('pixel_pros_roster_update', handleLocalRosterUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('pixel_pros_roster_update', handleLocalRosterUpdate);
    };
  }, [roomCode]);

  // Total points for user
  const filledStars = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean) as Competitor[];
  const userTotalPoints = filledStars.reduce((sum, p) => sum + (p?.score || 0), 0);

  const activeUser: UserProfile = {
    ...INITIAL_USER,
    username: userName,
    totalScore: userTotalPoints,
    selectedPlayerIds: [
      squadSlots.star1?.id || '',
      squadSlots.star2?.id || '',
      squadSlots.star3?.id || '',
    ],
    isLocked,
  };

  const selectedPlayerIdsArray = [
    squadSlots.star1?.id || '',
    squadSlots.star2?.id || '',
    squadSlots.star3?.id || '',
  ].filter(Boolean);

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#0b1021] text-[#fae5b8] selection:bg-[#12579b] selection:text-white">
        
        {/* Universal 8-bit Top Bar */}
        <header className="flex-shrink-0 z-40 bg-[#080d1a] border-b-3 border-[#1a264a] w-full max-w-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-md overflow-x-hidden box-border">
          <div className="w-full max-w-full flex items-center justify-between gap-1 sm:gap-3 flex-nowrap overflow-x-hidden">
            
            {/* Logo & Brand */}
            <button
              onClick={() => setCurrentTab('squad')}
              className="touch-manipulation flex items-center gap-1.5 sm:gap-2 cursor-pointer group bg-transparent border-0 p-0 text-left shrink-0"
              title="Return to My Squad"
            >
              <PixelHelmetIcon size={24} color={activeUser?.avatar?.helmetColor || '#155e9e'} />
              <span className="hidden sm:inline font-pixel text-[11px] sm:text-base text-[#fae5b8] tracking-wider group-hover:text-[#ffffff] transition-colors whitespace-nowrap">
                PIXEL PROS
              </span>
            </button>

            {/* 2-View Switcher: [ MY SQUAD ] and [ COUCH BOARD ] */}
            <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setCurrentTab('squad')}
                className={`touch-manipulation px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-center gap-1.5 font-pixel text-[11px] sm:text-xs border-2 cursor-pointer transition-all active:translate-y-0.5 ${
                  currentTab === 'squad'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552] hover:bg-[#232e4b] hover:text-[#fae5b8]'
                }`}
                title="My Squad"
              >
                <Users size={15} className={currentTab === 'squad' ? 'text-[#38bdf8]' : ''} />
                <span className="whitespace-nowrap">MY SQUAD</span>
              </button>

              <button
                onClick={() => setCurrentTab('couch')}
                className={`touch-manipulation px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-center gap-1.5 font-pixel text-[11px] sm:text-xs border-2 cursor-pointer transition-all active:translate-y-0.5 ${
                  currentTab === 'couch'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552] hover:bg-[#232e4b] hover:text-[#fae5b8]'
                }`}
                title="Couch Board"
              >
                <Trophy size={15} className={currentTab === 'couch' ? 'text-[#38bdf8]' : ''} />
                <span className="whitespace-nowrap">COUCH BOARD</span>
              </button>
            </nav>

            {/* Room, Live Score Header Badges & Small (?) Rules Icon */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a2238] border border-[#273552] rounded-xs font-pixel text-[10px] sm:text-xs text-[#fae5b8] whitespace-nowrap">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                <span className="text-[#38bdf8] hidden sm:inline">ROOM:</span>
                <span className="text-[#f59e0b] font-bold">{roomCode}</span>
              </div>
              
              <div className="flex items-center gap-1 px-2 py-1 bg-[#12579b] border border-[#0a2d52] rounded-xs font-pixel text-[10px] sm:text-xs text-[#fae5b8] whitespace-nowrap">
                <span className="text-[#38bdf8] hidden sm:inline">SCORE: </span>
                <span>{userTotalPoints.toLocaleString()} PTS</span>
              </div>

              {/* Small (?) Rules Icon in Top Right */}
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#1a2238] hover:bg-[#232e4b] text-[#fde047] hover:text-white border-2 border-[#273552] rounded-xs cursor-pointer active:translate-y-0.5 transition-all shadow-xs shrink-0"
                title="How Scoring Works (Rules)"
              >
                <HelpCircle size={16} />
              </button>
            </div>

          </div>
        </header>

        {/* Retro Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-200">
            <div className="bg-[#15803d] text-white px-3.5 py-1.5 border-3 border-[#052e16] font-retro text-xs sm:text-sm shadow-[0_4px_0_0_#022c11] flex items-center gap-2">
              <span>⚡</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Main Container with Retro Football Field Texture */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-6 sm:py-4 overscroll-contain football-field relative box-border">
          
          {/* Yard Lines Overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-between items-center opacity-15 px-4 sm:px-8 text-white font-pixel text-2xl sm:text-4xl select-none">
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span>50</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
          </div>

          {/* Content Views: 2-View Model ([ MY SQUAD ] and [ COUCH BOARD ]) */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-0 sm:px-4 py-2 sm:py-4 box-border">
            {currentTab === 'squad' && (
              <MyTeamView
                slots={squadSlots}
                userName={userName}
                roomCode={roomCode}
                isLocked={isLocked}
                matches={matches}
                onCommitUserName={handleCommitUserName}
                onCommitRoomCode={handleCommitRoomCode}
                onSelectSlot={(slotKey) => setActiveSlot(slotKey)}
                onClearSlot={handleClearSlot}
                onToggleLock={handleToggleLock}
                onLockedSlotAttempt={() => showToast('🔒 Lineup is LOCKED! Tap UNLOCK PICKS to make changes.')}
                onInspectPlayer={(player) => setDetailedPlayer(player)}
              />
            )}

            {currentTab === 'couch' && (
              <LeaderboardView
                user={activeUser}
                nflCompetitors={roster}
                roomRosters={roomRosters}
                roomCode={roomCode}
                userName={userName}
                onCommitRoomCode={handleCommitRoomCode}
                onCommitUserName={handleCommitUserName}
                onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
              />
            )}
          </div>

        </main>

        {/* Footer Info */}
        <footer className="flex-shrink-0 bg-[#080d1a] border-t-3 border-[#1a264a] py-2 px-3 sm:px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] sm:text-xs font-retro text-[#fae5b8]/70 z-20">
          <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-2">
            <div className="truncate text-left text-[10px] sm:text-xs">
              <strong>PIXEL PROS</strong> • Whole Numbers Only
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[10px] sm:text-[11px]">
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="touch-manipulation hover:underline text-[#fae5b8] cursor-pointer"
              >
                Rules (?)
              </button>
              <span className="text-[#334155]">•</span>
              <button
                onClick={() => setIsDbDrawerOpen(true)}
                className="touch-manipulation font-mono text-[10px] text-[#64748b] hover:text-[#38bdf8] transition-colors cursor-pointer"
                title="Open Supabase / SQL Developer Architecture"
              >
                [DEV / DB]
              </button>
            </div>
          </div>
        </footer>

        {/* Simple Rules Pop-up Modal */}
        {isRulesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0b1021] border-4 border-[#1a264a] shadow-[0_10px_0_0_#050811] p-4 sm:p-6 rounded-xs text-[#fae5b8] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#1a264a] pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <HelpCircle size={20} className="text-[#fde047]" />
                  <h2 className="font-pixel text-xs sm:text-sm text-[#fae5b8] tracking-wider uppercase">
                    SCORING RULES &amp; HOW IT WORKS
                  </h2>
                </div>
                <button
                  onClick={() => setIsRulesModalOpen(false)}
                  className="touch-manipulation w-8 h-8 bg-[#b91c1c] hover:bg-[#991b1b] text-white border-2 border-[#1a2238] flex items-center justify-center font-pixel text-xs cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5"
                  title="Close Rules"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 pr-1">
                <SimpleRulesView />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Supabase / SQL Developer Drawer */}
        {isDbDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b1021] border-4 border-[#1a264a] shadow-[0_10px_0_0_#050811] p-4 sm:p-6 rounded-xs text-[#fae5b8] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#1a264a] pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Database size={20} className="text-[#38bdf8]" />
                  <h2 className="font-pixel text-xs sm:text-sm text-[#fae5b8] tracking-wider uppercase">
                    DEVELOPER &amp; DATABASE ARCHITECTURE
                  </h2>
                </div>
                <button
                  onClick={() => setIsDbDrawerOpen(false)}
                  className="touch-manipulation w-8 h-8 bg-[#b91c1c] hover:bg-[#991b1b] text-white border-2 border-[#1a2238] flex items-center justify-center font-pixel text-xs cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 pr-1">
                <DatabaseSchemaView />
              </div>
            </div>
          </div>
        )}

        {/* Player Picker Modal strictly targeting activeSlot */}
        {activeSlot !== null && (
          <PlayerPickerModal
            isOpen={activeSlot !== null}
            onClose={() => setActiveSlot(null)}
            activeSlot={activeSlot}
            allPlayers={roster}
            currentSlotPlayerId={squadSlots[activeSlot]?.id || null}
            selectedPlayerIds={selectedPlayerIdsArray}
            matches={matches}
            onInspectPlayer={(player) => setDetailedPlayer(player)}
            onSelectPlayer={(player, targetSlot) => {
              handleAssignSlot(player, targetSlot);
              setActiveSlot(null);
            }}
          />
        )}

        {detailedPlayer && (() => {
          const livePlayer =
            roster.find(
              (p) =>
                p.id === detailedPlayer.id ||
                p.shortName.toLowerCase() === detailedPlayer.shortName.toLowerCase()
            ) || detailedPlayer;

          const occupiedSlot: ActiveSlot | null =
            squadSlots.star1?.id === livePlayer.id ? 'star1' :
            squadSlots.star2?.id === livePlayer.id ? 'star2' :
            squadSlots.star3?.id === livePlayer.id ? 'star3' : null;

          return (
            <PlayerCardModal
              player={livePlayer}
              onClose={() => setDetailedPlayer(null)}
              isSelectedForTeam={Boolean(occupiedSlot) || selectedPlayerIdsArray.includes(livePlayer.id)}
              onSelectForTeam={(player) => {
                // Find first empty slot or star1
                const emptySlot: ActiveSlot = !squadSlots.star1
                  ? 'star1'
                  : !squadSlots.star2
                  ? 'star2'
                  : !squadSlots.star3
                  ? 'star3'
                  : 'star1';
                handleAssignSlot(player, emptySlot);
                setDetailedPlayer(null);
              }}
              onSwapThisStar={() => {
                const slotToSwap: ActiveSlot = occupiedSlot || 'star1';
                setDetailedPlayer(null);
                setActiveSlot(slotToSwap);
              }}
              onDropPlayer={() => {
                if (occupiedSlot) {
                  handleClearSlot(occupiedSlot);
                }
              }}
            />
          );
        })()}

      </div>
    </ErrorBoundary>
  );
}
