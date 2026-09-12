import React, { useState } from 'react';
import {
  INITIAL_COMPETITORS,
  INITIAL_USER,
  INITIAL_LEADERBOARD_FRIENDS,
  INITIAL_LEADERBOARD_GLOBAL,
  LIVE_MATCHES,
} from './data/mockData';
import { Competitor, UserProfile, AvatarConfig, Match } from './types';
import { MyTeamView } from './components/MyTeamView';
import { LeaderboardView } from './components/LeaderboardView';
import { LiveScoresView } from './components/LiveScoresView';
import { SimpleRulesView } from './components/SimpleRulesView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { LockerRoomModal } from './components/LockerRoomModal';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PixelHelmetIcon } from './components/PixelBadges';
import { Users, Trophy, BookOpen, Shirt, Activity, Database } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'team' | 'live' | 'leaderboard' | 'rules'>('team');
  
  // App state
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [roster, setRoster] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [matches, setMatches] = useState<Match[]>(LIVE_MATCHES);
  const [friendsList, setFriendsList] = useState(INITIAL_LEADERBOARD_FRIENDS);
  const [globalList] = useState(INITIAL_LEADERBOARD_GLOBAL);

  // Modals state
  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [isLockerRoomOpen, setIsLockerRoomOpen] = useState(false);
  const [isDbDrawerOpen, setIsDbDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // 3 selected players for the active lineup
  const safeUserSelectedIds = user?.selectedPlayerIds || [];
  const selectedPlayers = safeUserSelectedIds
    .map(id => (roster || []).find(p => p.id === id))
    .filter(Boolean) as Competitor[];

  // Toggle player into 3-player lineup
  const handleTogglePlayer = (player: Competitor) => {
    const isSelected = safeUserSelectedIds.includes(player.id);
    if (isSelected) {
      setUser(prev => ({
        ...prev,
        selectedPlayerIds: prev.selectedPlayerIds.filter(id => id !== player.id),
      }));
      showToast(`Removed ${player.shortName} from your 3-player lineup.`);
    } else {
      if (safeUserSelectedIds.length >= 3) {
        showToast(`Lineup is full! Max 3 players allowed for this week.`);
        return;
      }
      setUser(prev => ({
        ...prev,
        selectedPlayerIds: [...prev.selectedPlayerIds, player.id],
      }));
      showToast(`Added ${player.shortName} to your 3-player lineup! ⭐`);
    }
  };

  // Open detail for slot selection
  const handleSelectSlot = (_index: number) => {
    // Find first available player not in team and open their card for immediate 1-tap addition
    const available = (roster || []).find(p => !safeUserSelectedIds.includes(p.id));
    if (available) {
      setDetailedPlayer(available);
    } else {
      showToast('Your 3-player lineup is already full! Remove a player to swap.');
    }
  };

  // Locker room avatar save
  const handleSaveAvatar = (newAvatar: AvatarConfig, newCoins: number) => {
    setUser(prev => ({
      ...prev,
      avatar: newAvatar,
      coins: newCoins,
    }));
    // Also update Jeerice Henry (mock player #88) if user customized him
    setRoster(prev =>
      (prev || []).map(p => {
        if (p.displayName === 'Jeerice Henry') {
          return {
            ...p,
            avatar: newAvatar,
            uniformNumber: newAvatar.number,
          };
        }
        return p;
      })
    );
    showToast('New gear equipped in Locker Room!');
  };

  // Scoring whole-number points from live plays or rule tester
  const handleScorePoints = (points: number, eventName: string) => {
    setUser(prev => ({
      ...prev,
      totalScore: prev.totalScore + points,
      coins: prev.coins + points * 10,
    }));

    // Update friend rank score for "YOU"
    setFriendsList(prev =>
      (prev || []).map(item =>
        item.isYou ? { ...item, score: item.score + points } : item
      )
    );

    showToast(`+${points} WHOLE POINTS! (${eventName}) 🎉`);
  };

  const handleSimulatePlay = (player: Competitor, eventName: string, points: number) => {
    // Increment player stats
    setRoster(prev =>
      (prev || []).map(p => {
        if (p.id === player.id) {
          return {
            ...p,
            stats: {
              ...p.stats,
              touchdowns: (p.stats?.touchdowns || 0) + 1,
              passingYards: (p.stats?.passingYards || 0) + 40,
            },
            score: (p.score || 0) + points * 50,
          };
        }
        return p;
      })
    );

    // Update match score
    setMatches(prev =>
      (prev || []).map(m =>
        m.id === 'm1'
          ? {
              ...m,
              homeScore: m.homeScore + points,
              recentEvent: `${player.shortName} +${points} PTS (${eventName})`,
            }
          : m
      )
    );

    handleScorePoints(points, `${player.shortName} ${eventName}`);
  };

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#0b1021] text-[#fae5b8] selection:bg-[#12579b] selection:text-white">
        
        {/* Universal 8-bit Top Bar (Strict Single-Row Containment & Mobile-Optimized) */}
        <header className="flex-shrink-0 z-40 bg-[#080d1a] border-b-3 border-[#1a264a] w-full max-w-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-md overflow-x-hidden box-border">
          <div className="w-full max-w-full flex items-center justify-between gap-1 sm:gap-3 flex-nowrap overflow-x-hidden">
            
            {/* Logo & Brand */}
            <button
              onClick={() => setCurrentTab('team')}
              className="touch-manipulation flex items-center gap-1 sm:gap-2 cursor-pointer group bg-transparent border-0 p-0 text-left shrink-0"
              title="Return to My Team"
            >
              <PixelHelmetIcon size={22} color={user?.avatar?.helmetColor || '#155e9e'} />
              <span className="font-pixel text-[11px] sm:text-base text-[#fae5b8] tracking-wider group-hover:text-[#ffffff] transition-colors whitespace-nowrap">
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
              ].map(tab => {
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

            {/* User Status & Gear Locker Room */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Compact Score Badge on Mobile (Hide "SCORE:" label under 640px) */}
              <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 sm:py-2 bg-[#1a2238] border border-[#273552] rounded-xs font-pixel text-[10px] sm:text-xs text-[#fae5b8] whitespace-nowrap">
                <span className="text-[#38bdf8] hidden sm:inline">SCORE: </span>
                <span>
                  {(user?.totalScore ?? 0) >= 10000
                    ? `${((user?.totalScore ?? 0) / 1000).toFixed(1)}K`
                    : (user?.totalScore ?? 0).toLocaleString()}
                </span>
              </div>
              
              {/* Compact Gear Button on Mobile (Icon only under 640px) */}
              <button
                onClick={() => setIsLockerRoomOpen(true)}
                className="touch-manipulation p-2 sm:px-2.5 sm:py-1.5 min-w-[36px] sm:min-w-0 flex items-center justify-center gap-1 bg-[#d97706] hover:bg-[#b45309] text-white border-2 border-[#78350f] font-pixel text-[10px] sm:text-xs cursor-pointer shadow-[0_2px_0_0_#451a03] active:translate-y-0.5 active:shadow-none shrink-0"
                title="Open Locker Room"
              >
                <Shirt size={15} />
                <span className="hidden sm:inline">GEAR</span>
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

        {/* Main Container with Retro Football Field Texture (Scrolls internally) */}
        <main className="flex-1 overflow-y-auto px-2 py-2 sm:px-6 sm:py-4 overscroll-contain football-field relative box-border">
          
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
          <div className="relative z-10 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 box-border">
            {currentTab === 'team' && (
              <MyTeamView
                roster={roster}
                user={user}
                selectedPlayers={selectedPlayers}
                onSelectSlot={handleSelectSlot}
                onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
                onOpenLockerRoom={() => setIsLockerRoomOpen(true)}
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
                user={user}
                friendsList={friendsList}
                globalList={globalList}
                onOpenPlayerDetail={(name) => {
                  const p = (roster || []).find(r => r.displayName === name || r.shortName === name);
                  if (p) setDetailedPlayer(p);
                }}
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
                    DEVELOPER & DATABASE ARCHITECTURE
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

        {isLockerRoomOpen && (
          <LockerRoomModal
            currentAvatar={user.avatar}
            userCoins={user.coins}
            onSaveAvatar={handleSaveAvatar}
            onClose={() => setIsLockerRoomOpen(false)}
          />
        )}

      </div>
    </ErrorBoundary>
  );
}
