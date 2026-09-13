import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_COMPETITORS,
  INITIAL_USER,
  LIVE_MATCHES,
} from './data/mockData';
import { Competitor, UserProfile, Match, UserRoster } from './types';
import {
  subscribeToRealtimeScores,
  fetchLiveNFLCompetitors,
  fetchLiveNFLMatches,
  upsertUserRoster,
  fetchRoomRosters,
} from './lib/supabaseClient';
import { MyTeamView } from './components/MyTeamView';
import { LeaderboardView } from './components/LeaderboardView';
import { LiveScoresView } from './components/LiveScoresView';
import { SimpleRulesView } from './components/SimpleRulesView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { PlayerPickerModal } from './components/PlayerPickerModal';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PixelHelmetIcon } from './components/PixelBadges';
import { Users, Trophy, BookOpen, Activity, Database } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'team' | 'live' | 'leaderboard' | 'rules'>('team');
  
  // Room Code & User Name state (persisted to localStorage)
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

  const [roomRosters, setRoomRosters] = useState<UserRoster[]>([]);

  // User lineup state
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedStars = localStorage.getItem('pixel_pros_user_stars');
      if (savedStars) {
        const parsed = JSON.parse(savedStars);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return { ...INITIAL_USER, selectedPlayerIds: parsed };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USER;
  });

  const [roster, setRoster] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [matches, setMatches] = useState<Match[]>(LIVE_MATCHES);

  // Modals state
  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);
  const [isDbDrawerOpen, setIsDbDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Sync picks directly to Supabase table user_rosters
  const syncLineupToSupabase = useCallback(
    async (rCode: string, uName: string, starIds: string[]) => {
      const star1 = starIds[0] || '';
      const star2 = starIds[1] || '';
      const star3 = starIds[2] || '';
      await upsertUserRoster(rCode, uName, star1, star2, star3);
      // Refresh room rosters
      const updated = await fetchRoomRosters(rCode);
      setRoomRosters(updated);
    },
    []
  );

  // Handle Room Code Change
  const handleRoomCodeChange = (newCode: string) => {
    const clean = newCode.trim().toUpperCase() || 'COUCH';
    setRoomCode(clean);
    try {
      localStorage.setItem('pixel_pros_room_code', clean);
    } catch {
      // ignore
    }
    syncLineupToSupabase(clean, userName, user.selectedPlayerIds || []);
    showToast(`Switched to room "${clean}"`);
  };

  // Handle User Name Change
  const handleUserNameChange = (newName: string) => {
    setUserName(newName);
    try {
      localStorage.setItem('pixel_pros_user_name', newName);
    } catch {
      // ignore
    }
    syncLineupToSupabase(roomCode, newName, user.selectedPlayerIds || []);
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
          setRoster((prev) =>
            (prev || []).map((p) => {
              if (p.id === updated.id || p.shortName === updated.short_name) {
                const newScore = updated.score ?? p.score;
                return {
                  ...p,
                  score: newScore,
                  stats: updated.stats ? { ...p.stats, ...updated.stats } : p.stats,
                };
              }
              return p;
            })
          );
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

    // Also listen to local cross-tab event
    const handleLocalRosterUpdate = () => {
      fetchRoomRosters(roomCode).then(setRoomRosters);
    };
    window.addEventListener('pixel_pros_roster_update', handleLocalRosterUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('pixel_pros_roster_update', handleLocalRosterUpdate);
    };
  }, [roomCode]);

  // 3 selected players for the active lineup (STAR 1, STAR 2, STAR 3)
  const safeUserSelectedIds = user?.selectedPlayerIds || ['mahomes', 'henry', 'lamb'];
  const selectedPlayers = [0, 1, 2].map((slotIdx) => {
    const id = safeUserSelectedIds[slotIdx];
    return (roster || []).find((p) => p.id === id) || null;
  }).filter(Boolean) as Competitor[];

  // Calculate live total score from chosen 3 stars
  const userTotalPoints = selectedPlayers.reduce((sum, p) => sum + (p?.score || 0), 0);
  const activeUser: UserProfile = {
    ...user,
    username: userName,
    totalScore: userTotalPoints,
  };

  // Helper to persist chosen 3 star IDs
  const persistStars = (ids: string[]) => {
    try {
      localStorage.setItem('pixel_pros_user_stars', JSON.stringify(ids));
    } catch {
      // ignore
    }
    syncLineupToSupabase(roomCode, userName, ids);
  };

  // Assign any real NFL athlete into a specific STAR slot (STAR 1, 2, or 3)
  const handleAssignSlot = (player: Competitor, slotIndex: number) => {
    setUser((prev) => {
      const currentIds = [...(prev.selectedPlayerIds || [])];
      while (currentIds.length < 3) {
        currentIds.push('');
      }
      // If player is already in another slot, clear that slot to avoid duplicates
      for (let i = 0; i < 3; i++) {
        if (currentIds[i] === player.id) {
          currentIds[i] = '';
        }
      }
      currentIds[slotIndex] = player.id;
      persistStars(currentIds);
      return {
        ...prev,
        selectedPlayerIds: currentIds,
      };
    });
    showToast(`★ ${player.displayName} (${player.teamCode}) assigned to STAR ${slotIndex + 1}!`);
  };

  // Clear a specific STAR slot
  const handleClearSlot = (slotIndex: number) => {
    setUser((prev) => {
      const currentIds = [...(prev.selectedPlayerIds || [])];
      if (currentIds[slotIndex]) {
        currentIds[slotIndex] = '';
      }
      persistStars(currentIds);
      return {
        ...prev,
        selectedPlayerIds: currentIds,
      };
    });
    showToast(`Cleared STAR ${slotIndex + 1} slot.`);
  };

  // Toggle player into 3-player lineup
  const handleTogglePlayer = (player: Competitor) => {
    const isSelected = safeUserSelectedIds.includes(player.id);
    if (isSelected) {
      setUser((prev) => {
        const nextIds = prev.selectedPlayerIds.map((id) => (id === player.id ? '' : id));
        persistStars(nextIds);
        return {
          ...prev,
          selectedPlayerIds: nextIds,
        };
      });
      showToast(`Removed ${player.displayName} from your 3 Stars.`);
    } else {
      // Find first empty slot
      const emptyIdx = [0, 1, 2].find((idx) => !safeUserSelectedIds[idx]);
      if (emptyIdx !== undefined) {
        handleAssignSlot(player, emptyIdx);
      } else {
        // Replace slot 0 if all are full
        handleAssignSlot(player, 0);
      }
    }
  };

  // Tapping any slot opens the player picker for that slot
  const handleSelectSlot = (slotIndex: number) => {
    setPickerSlotIndex(slotIndex);
  };

  // Scoring whole-number points from live plays or rule tester
  const handleSimulatePlay = (player: Competitor, eventName: string, points: number) => {
    // Increment player stats with integer whole points
    setRoster((prev) =>
      (prev || []).map((p) => {
        if (p.id === player.id) {
          return {
            ...p,
            stats: {
              ...p.stats,
              touchdowns: (p.stats?.touchdowns || 0) + 1,
              passingYards: (p.stats?.passingYards || 0) + 50,
            },
            score: (p.score || 0) + points,
          };
        }
        return p;
      })
    );

    // Update match score if matches exist
    setMatches((prev) =>
      (prev || []).map((m, idx) =>
        idx === 0
          ? {
              ...m,
              homeScore: (m.homeScore || 0) + points,
              recentEvent: `${player.shortName} +${points} PTS (${eventName})`,
            }
          : m
      )
    );

    showToast(`+${points} WHOLE PTS: ${player.shortName} (${eventName}) 🎉`);
  };

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#0b1021] text-[#fae5b8] selection:bg-[#12579b] selection:text-white">
        
        {/* Universal 8-bit Top Bar (Strict Single-Row Containment & Mobile-Optimized) */}
        <header className="flex-shrink-0 z-40 bg-[#080d1a] border-b-3 border-[#1a264a] w-full max-w-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-md overflow-x-hidden box-border">
          <div className="w-full max-w-full flex items-center justify-between gap-1 sm:gap-3 flex-nowrap overflow-x-hidden">
            
            {/* Logo & Brand: Hide text "Pixel Pros" on mobile headers; display only retro helmet icon */}
            <button
              onClick={() => setCurrentTab('team')}
              className="touch-manipulation flex items-center gap-1.5 sm:gap-2 cursor-pointer group bg-transparent border-0 p-0 text-left shrink-0"
              title="Return to My Team"
            >
              <PixelHelmetIcon size={24} color={activeUser?.avatar?.helmetColor || '#155e9e'} />
              <span className="hidden sm:inline font-pixel text-[11px] sm:text-base text-[#fae5b8] tracking-wider group-hover:text-[#ffffff] transition-colors whitespace-nowrap">
                PIXEL PROS
              </span>
            </button>

            {/* Clean 4-Tab Navigation (Icon-Only on Mobile, Icon + Text on sm+) */}
            <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {[
                { id: 'team', label: 'MY TEAM', icon: Users },
                { id: 'live', label: 'LIVE SCORES', icon: Activity },
                { id: 'leaderboard', label: 'LEADERBOARD', icon: Trophy },
                { id: 'rules', label: 'RULES', icon: BookOpen },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`touch-manipulation p-2 sm:px-3 sm:py-2 min-w-[38px] sm:min-w-[40px] flex items-center justify-center gap-1.5 font-pixel text-[10px] sm:text-xs border-2 cursor-pointer transition-all active:translate-y-0.5 ${
                      isActive
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                        : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552] hover:bg-[#232e4b] hover:text-[#fae5b8]'
                    }`}
                    title={tab.label}
                  >
                    <Icon size={16} className={isActive ? 'text-[#38bdf8]' : ''} />
                    <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Room & Live Score Header Badges */}
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

        {/* Main Container with Retro Football Field Texture (Scrolls internally) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-6 sm:py-4 overscroll-contain football-field relative box-border">
          
          {/* Yard Lines Overlay on Football Field */}
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

          {/* Content Views */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-0 sm:px-4 py-2 sm:py-4 box-border">
            {currentTab === 'team' && (
              <MyTeamView
                roster={roster}
                user={activeUser}
                selectedPlayers={selectedPlayers}
                userName={userName}
                roomCode={roomCode}
                onUserNameChange={handleUserNameChange}
                onRoomCodeChange={handleRoomCodeChange}
                onSelectSlot={handleSelectSlot}
                onClearSlot={handleClearSlot}
                onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
                onOpenStatsModal={() => setCurrentTab('live')}
                onTogglePlayer={handleTogglePlayer}
              />
            )}

            {currentTab === 'live' && (
              <LiveScoresView
                matches={matches}
                competitors={roster}
                onSelectPlayer={(player) => setDetailedPlayer(player)}
                onSimulatePlay={handleSimulatePlay}
              />
            )}

            {currentTab === 'leaderboard' && (
              <LeaderboardView
                user={activeUser}
                nflCompetitors={roster}
                roomRosters={roomRosters}
                roomCode={roomCode}
                userName={userName}
                onRoomCodeChange={handleRoomCodeChange}
                onUserNameChange={handleUserNameChange}
                onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
              />
            )}

            {currentTab === 'rules' && (
              <SimpleRulesView />
            )}
          </div>

        </main>

        {/* Footer Info (Pinned to bottom with iOS safe-area inset) */}
        <footer className="flex-shrink-0 bg-[#080d1a] border-t-3 border-[#1a264a] py-2 px-3 sm:px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] sm:text-xs font-retro text-[#fae5b8]/70 z-20">
          <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-2">
            <div className="truncate text-left text-[10px] sm:text-xs">
              <strong>PIXEL PROS</strong> • Whole Numbers Only
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[10px] sm:text-[11px]">
              <button
                onClick={() => setCurrentTab('rules')}
                className="touch-manipulation hover:underline text-[#fae5b8] cursor-pointer"
              >
                Rules
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

        {/* Modals */}
        {pickerSlotIndex !== null && (
          <PlayerPickerModal
            isOpen={pickerSlotIndex !== null}
            onClose={() => setPickerSlotIndex(null)}
            slotIndex={pickerSlotIndex}
            allPlayers={roster}
            selectedPlayerIds={safeUserSelectedIds}
            onSelectPlayer={(player, slotIdx) => {
              handleAssignSlot(player, slotIdx);
              setPickerSlotIndex(null);
            }}
          />
        )}

        {detailedPlayer && (
          <PlayerCardModal
            player={detailedPlayer}
            onClose={() => setDetailedPlayer(null)}
            onSelectForTeam={(player) => {
              handleTogglePlayer(player);
              setDetailedPlayer(null);
            }}
            isSelectedForTeam={safeUserSelectedIds.includes(detailedPlayer.id)}
          />
        )}

      </div>
    </ErrorBoundary>
  );
}
