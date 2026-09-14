import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_USER,
} from './data/mockData';
import { Competitor, UserProfile, Match, UserRoster, ActiveSlot, SquadSlots } from './types';
import {
  subscribeToRealtimeScores,
  subscribeToRoomRosters,
  fetchLiveNFLCompetitors,
  fetchLiveNFLMatches,
  upsertUserRoster,
  fetchRoomRosters,
  isGhostUser,
} from './lib/supabaseClient';
import { getDeviceId } from './lib/deviceIdentity';
import { getTeamFullName } from './utils/teamData';
import { MyTeamView } from './components/MyTeamView';
import { LeaderboardView } from './components/LeaderboardView';
import { FamilySquadSwitcher } from './components/FamilySquadSwitcher';
import { SimpleRulesView } from './components/SimpleRulesView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { PlayerPickerModal } from './components/PlayerPickerModal';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PixelHelmetIcon } from './components/PixelBadges';
import { Users, Trophy, Database, HelpCircle, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'squad' | 'couch'>('squad');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  
  // Room Code & User Name state
  const [userName, setUserName] = useState<string>(() => {
    try {
      return (localStorage.getItem('pixel_pros_user_name') || 'DAD').trim().toUpperCase();
    } catch {
      return 'DAD';
    }
  });

  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      return (localStorage.getItem('pixel_pros_room_code') || 'COUCH').toUpperCase();
    } catch {
      return 'COUCH';
    }
  });

  // Master NFL athletes and matches loaded directly from Supabase
  const [roster, setRoster] = useState<Competitor[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [roomRosters, setRoomRosters] = useState<UserRoster[]>([]);

  // Explicit 3-slot roster state: star1, star2, star3 (Can be null)
  const [squadSlots, setSquadSlots] = useState<{
    star1: Competitor | null;
    star2: Competitor | null;
    star3: Competitor | null;
  }>({ star1: null, star2: null, star3: null });

  // Track activeSlot ('star1' | 'star2' | 'star3') when tapping a slot
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

  // Lock Picks Engine State (persisted per room and user_name)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const cleanRoom = (localStorage.getItem('pixel_pros_room_code') || 'COUCH').trim().toUpperCase();
      const cleanName = (localStorage.getItem('pixel_pros_user_name') || 'DAD').trim().toUpperCase();
      return localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`) === 'true';
    } catch {
      return false;
    }
  });

  // Modals state
  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [isDbDrawerOpen, setIsDbDrawerOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [tempRoomCode, setTempRoomCode] = useState(roomCode);
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
      const normalizedRoom = (rCode || 'COUCH').trim().toUpperCase();
      const cleanName = (uName || 'DAD').trim().toUpperCase();
      const s1Id = slotsObj.star1 ? slotsObj.star1.id : '';
      const s2Id = slotsObj.star2 ? slotsObj.star2.id : '';
      const s3Id = slotsObj.star3 ? slotsObj.star3.id : '';
      const finalLocked = typeof lockedFlag === 'boolean' ? lockedFlag : isLocked;

      // Save squad-specific roster to localStorage
      try {
        localStorage.setItem(`pixel_pros_roster_${normalizedRoom}_${cleanName}`, JSON.stringify([s1Id, s2Id, s3Id]));
        localStorage.setItem(`pixel_pros_picks_locked_${normalizedRoom}_${cleanName}`, String(finalLocked));
      } catch {
        // ignore
      }

      await upsertUserRoster(normalizedRoom, cleanName, s1Id, s2Id, s3Id, finalLocked);
      // Refresh room rosters
      const updated = await fetchRoomRosters(normalizedRoom);
      setRoomRosters(updated);
    },
    [isLocked]
  );

  // Switch Active Squad (Pill Selector): Instantly hydrates that family member's 3 stars and lock state
  const handleSelectSquad = (squadName: string) => {
    const cleanName = squadName.trim().toUpperCase();
    if (!cleanName) return;

    setUserName(cleanName);
    try {
      localStorage.setItem('pixel_pros_user_name', cleanName);
    } catch {
      // ignore
    }

    const normalizedRoom = (roomCode || 'COUCH').trim().toUpperCase();
    const existingRoster = roomRosters.find(
      (r) => (r.room_code || '').toUpperCase() === normalizedRoom && r.user_name.toUpperCase() === cleanName
    );

    let s1: Competitor | null = null;
    let s2: Competitor | null = null;
    let s3: Competitor | null = null;
    let squadLocked = false;

    if (existingRoster) {
      s1 = roster.find((p) => p.id === existingRoster.star_1_id) || null;
      s2 = roster.find((p) => p.id === existingRoster.star_2_id) || null;
      s3 = roster.find((p) => p.id === existingRoster.star_3_id) || null;
      squadLocked = Boolean(
        existingRoster.is_locked ||
        existingRoster.device_id === 'LOCKED' ||
        localStorage.getItem(`pixel_pros_picks_locked_${normalizedRoom}_${cleanName}`) === 'true'
      );
    } else {
      try {
        const saved = localStorage.getItem(`pixel_pros_roster_${normalizedRoom}_${cleanName}`);
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            s1 = roster.find((p) => p.id === ids[0]) || null;
            s2 = roster.find((p) => p.id === ids[1]) || null;
            s3 = roster.find((p) => p.id === ids[2]) || null;
          }
        }
        squadLocked = localStorage.getItem(`pixel_pros_picks_locked_${normalizedRoom}_${cleanName}`) === 'true';
      } catch {
        // ignore
      }
    }

    setSquadSlots({ star1: s1, star2: s2, star3: s3 });
    setIsLocked(squadLocked);
    setCurrentTab('squad');
    showToast(`Switched active squad to "${cleanName}"`);
  };

  // Add New Squad: Creates a clean lineup for this family member and immediately registers to Supabase
  const handleCreateSquad = async (squadName: string) => {
    const cleanName = squadName.trim().toUpperCase();
    if (!cleanName) return;

    const normalizedRoom = (roomCode || 'COUCH').trim().toUpperCase();
    setUserName(cleanName);
    try {
      localStorage.setItem('pixel_pros_user_name', cleanName);
      localStorage.setItem(`pixel_pros_picks_locked_${normalizedRoom}_${cleanName}`, 'false');
      localStorage.setItem(`pixel_pros_roster_${normalizedRoom}_${cleanName}`, JSON.stringify(['', '', '']));
    } catch {
      // ignore
    }

    const freshSlots = { star1: null, star2: null, star3: null };
    setSquadSlots(freshSlots);
    setIsLocked(false);

    // Upsert fresh lineup to Supabase
    await upsertUserRoster(normalizedRoom, cleanName, null, null, null, false);
    const updated = await fetchRoomRosters(normalizedRoom);
    setRoomRosters(updated);

    setCurrentTab('squad');
    showToast(`★ Created squad "${cleanName}" in Room ${normalizedRoom}! Draft your 3 Stars.`);
  };

  // Switch Room Code: Forces immediate sync and re-fetch of room rosters
  const handleCommitRoomCode = async (newCode: string) => {
    const clean = (newCode || 'COUCH').trim().toUpperCase();
    setRoomCode(clean);
    try {
      localStorage.setItem('pixel_pros_room_code', clean);
    } catch {
      // ignore
    }

    // 1. Immediately fetch rosters for the newly entered room from Supabase
    const freshRosters = await fetchRoomRosters(clean);
    setRoomRosters(freshRosters);

    // 2. Cross-Device Persistence (The Apple Store Demo Test):
    // Check if the current user already has a lineup in this room
    const currentName = (userName || 'DAD').trim().toUpperCase();
    const existingSquad = freshRosters.find((r) => r.user_name.toUpperCase() === currentName);

    if (existingSquad) {
      const s1 = roster.find((p) => p.id === existingSquad.star_1_id) || null;
      const s2 = roster.find((p) => p.id === existingSquad.star_2_id) || null;
      const s3 = roster.find((p) => p.id === existingSquad.star_3_id) || null;
      const roomLocked = Boolean(
        existingSquad.is_locked ||
        existingSquad.device_id === 'LOCKED' ||
        localStorage.getItem(`pixel_pros_picks_locked_${clean}_${currentName}`) === 'true'
      );
      setSquadSlots({ star1: s1, star2: s2, star3: s3 });
      setIsLocked(roomLocked);
      showToast(`Loaded ${currentName}'s squad from Room ${clean}`);
    } else if (freshRosters.length > 0) {
      // If room already has other family squads (e.g. DAD, LEO, VIOLET), select the first squad and hydrate
      const firstSquad = freshRosters[0];
      const firstSquadName = firstSquad.user_name.toUpperCase();
      setUserName(firstSquadName);
      try {
        localStorage.setItem('pixel_pros_user_name', firstSquadName);
      } catch {
        // ignore
      }
      const s1 = roster.find((p) => p.id === firstSquad.star_1_id) || null;
      const s2 = roster.find((p) => p.id === firstSquad.star_2_id) || null;
      const s3 = roster.find((p) => p.id === firstSquad.star_3_id) || null;
      const roomLocked = Boolean(
        firstSquad.is_locked ||
        firstSquad.device_id === 'LOCKED' ||
        localStorage.getItem(`pixel_pros_picks_locked_${clean}_${firstSquadName}`) === 'true'
      );
      setSquadSlots({ star1: s1, star2: s2, star3: s3 });
      setIsLocked(roomLocked);
      showToast(`Joined Room ${clean} as ${firstSquadName}`);
    } else {
      // Room is empty or newly created
      let loadedSlots = { star1: null, star2: null, star3: null };
      if (clean === 'COUCH') {
        loadedSlots = {
          star1: roster.find((p) => p.displayName.toLowerCase().includes('josh allen')) || roster[0] || null,
          star2: roster.find((p) => p.displayName.toLowerCase().includes('derrick henry')) || roster[1] || null,
          star3: roster.find((p) => p.displayName.toLowerCase().includes('ceedee lamb')) || roster[2] || null,
        };
      }
      setSquadSlots(loadedSlots);
      setIsLocked(false);
      await syncLineupToSupabase(clean, currentName, loadedSlots, false);
      showToast(`Joined Room "${clean}"`);
    }
  };

  // Commit User Name
  const handleCommitUserName = (newName: string) => {
    const clean = newName.trim().toUpperCase();
    if (!clean) return;
    setUserName(clean);
    try {
      localStorage.setItem('pixel_pros_user_name', clean);
    } catch {
      // ignore
    }
    syncLineupToSupabase(roomCode, clean, squadSlots, isLocked);
    showToast(`Squad name updated to ${clean}`);
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
    const cleanName = (userName || 'DAD').trim().toUpperCase();
    const filledCount = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean).length;

    if (nextLocked && filledCount < 3) {
      showToast(`⚠️ Please select all 3 Stars before locking! (${filledCount}/3 picked)`);
      return;
    }

    setIsLocked(nextLocked);
    try {
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`, String(nextLocked));
    } catch {
      // ignore
    }

    syncLineupToSupabase(cleanRoom, cleanName, squadSlots, nextLocked);

    if (nextLocked) {
      showToast(`🔒 PICKS LOCKED: ${cleanName}'s lineup submitted to Couch Board!`);
    } else {
      showToast(`🔓 PICKS UNLOCKED: ${cleanName}'s slots are now editable.`);
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
            // Re-sync active squad objects with live scores or restore from Supabase/saved room picks
            const activeRoom = (localStorage.getItem('pixel_pros_room_code') || 'COUCH').trim().toUpperCase();
            const activeName = (localStorage.getItem('pixel_pros_user_name') || 'DAD').trim().toUpperCase();

            // 1. Check if Supabase already has a squad record for (activeRoom, activeName)
            const dbRoster = (initialRosters || []).find(
              (r) => (r.room_code || '').toUpperCase() === activeRoom && r.user_name.toUpperCase() === activeName
            );

            let s1: Competitor | null = null;
            let s2: Competitor | null = null;
            let s3: Competitor | null = null;
            let initialLock = false;

            if (dbRoster) {
              s1 = athletes.find((a) => a.id === dbRoster.star_1_id) || null;
              s2 = athletes.find((a) => a.id === dbRoster.star_2_id) || null;
              s3 = athletes.find((a) => a.id === dbRoster.star_3_id) || null;
              initialLock = Boolean(dbRoster.is_locked || dbRoster.device_id === 'LOCKED');
            } else {
              // 2. Check localStorage cache for this squad
              const saved =
                localStorage.getItem(`pixel_pros_roster_${activeRoom}_${activeName}`) ||
                localStorage.getItem(`pixel_pros_roster_${activeRoom}`);
              if (saved) {
                try {
                  const ids: string[] = JSON.parse(saved);
                  if (Array.isArray(ids)) {
                    s1 = athletes.find((a) => a.id === ids[0] || a.shortName.toLowerCase() === ids[0]?.toLowerCase() || a.displayName.toLowerCase().includes(ids[0]?.toLowerCase())) || null;
                    s2 = athletes.find((a) => a.id === ids[1] || a.shortName.toLowerCase() === ids[1]?.toLowerCase() || a.displayName.toLowerCase().includes(ids[1]?.toLowerCase())) || null;
                    s3 = athletes.find((a) => a.id === ids[2] || a.shortName.toLowerCase() === ids[2]?.toLowerCase() || a.displayName.toLowerCase().includes(ids[2]?.toLowerCase())) || null;
                  }
                } catch {
                  // ignore
                }
              }
              initialLock = localStorage.getItem(`pixel_pros_picks_locked_${activeRoom}_${activeName}`) === 'true';
            }

            if (!s1 && !s2 && !s3 && activeRoom === 'COUCH') {
              s1 = athletes.find((a) => a.displayName.toLowerCase().includes('josh allen')) || athletes[0] || null;
              s2 = athletes.find((a) => a.displayName.toLowerCase().includes('derrick henry')) || athletes[1] || null;
              s3 = athletes.find((a) => a.displayName.toLowerCase().includes('ceedee lamb')) || athletes.find((a) => a.displayName.toLowerCase().includes('mahomes')) || athletes[2] || null;
            }

            setSquadSlots({ star1: s1, star2: s2, star3: s3 });
            setIsLocked(initialLock);
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
        const row = matchPayload?.new as any;
        if (row && row.id) {
          const homeCode = String(row.home_team || row.home_team_code || '').trim().toUpperCase();
          const awayCode = String(row.away_team || row.away_team_code || '').trim().toUpperCase();
          const rawStatus = String(row.status || '').toLowerCase();
          const qTime = String(row.quarter_time || '').trim();

          const isFinal = rawStatus === 'final' || qTime.toLowerCase().includes('final');
          const isLive = rawStatus === 'live' || (!isFinal && (qTime.includes('th') || qTime.includes('1st') || qTime.includes('2nd') || qTime.includes('3rd') || qTime.includes('Half') || qTime.includes('OT')));
          const isScheduled = !isFinal && !isLive;

          const awayScore = Number(row.away_score || 0);
          const homeScore = Number(row.home_score || 0);

          const updatedMatch: Match = {
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
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // ⚡ Dedicated Realtime Room Channel: Teardown previous channel and subscribe to new channel for this normalized room
  useEffect(() => {
    const normalizedRoom = (roomCode || 'COUCH').trim().toUpperCase();

    // Immediately fetch room rosters
    fetchRoomRosters(normalizedRoom).then((rosters) => {
      setRoomRosters(rosters);
    });

    const unsubscribeRoom = subscribeToRoomRosters(normalizedRoom, async () => {
      const fresh = await fetchRoomRosters(normalizedRoom);
      setRoomRosters(fresh);

      // Hydrate active squad if updated remotely by another device
      const currentCleanName = (userName || 'DAD').trim().toUpperCase();
      const remoteSquad = fresh.find((r) => r.user_name.toUpperCase() === currentCleanName);
      if (remoteSquad) {
        setSquadSlots((prev) => {
          const s1Changed = (prev.star1?.id || '') !== (remoteSquad.star_1_id || '');
          const s2Changed = (prev.star2?.id || '') !== (remoteSquad.star_2_id || '');
          const s3Changed = (prev.star3?.id || '') !== (remoteSquad.star_3_id || '');
          if (s1Changed || s2Changed || s3Changed) {
            return {
              star1: roster.find((p) => p.id === remoteSquad.star_1_id) || null,
              star2: roster.find((p) => p.id === remoteSquad.star_2_id) || null,
              star3: roster.find((p) => p.id === remoteSquad.star_3_id) || null,
            };
          }
          return prev;
        });

        const isRemoteLocked = Boolean(remoteSquad.is_locked || remoteSquad.device_id === 'LOCKED');
        setIsLocked((prev) => (prev !== isRemoteLocked ? isRemoteLocked : prev));
      }

      showToast(`⚡ ROOM UPDATE in ${normalizedRoom}!`);
    });

    const handleLocalRosterUpdate = () => {
      fetchRoomRosters(normalizedRoom).then(setRoomRosters);
    };
    window.addEventListener('pixel_pros_roster_update', handleLocalRosterUpdate);

    return () => {
      unsubscribeRoom();
      window.removeEventListener('pixel_pros_roster_update', handleLocalRosterUpdate);
    };
  }, [roomCode, userName, roster]);

  // Total points for user
  const filledStars = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean) as Competitor[];
  const userTotalPoints = filledStars.reduce((sum, p) => sum + (p?.score || 0), 0);

  const normalizedRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const normalizedActiveUser = (userName || 'DAD').trim().toUpperCase();

  // Dynamic Family Squads list in this room for the switcher
  const squadPillsData = roomRosters
    .filter((r) => !isGhostUser(r.user_name) && (r.room_code || '').toUpperCase() === normalizedRoom)
    .map((r) => {
      const s1 = roster.find((p) => p.id === r.star_1_id);
      const s2 = roster.find((p) => p.id === r.star_2_id);
      const s3 = roster.find((p) => p.id === r.star_3_id);
      const stars = [s1, s2, s3].filter(Boolean) as Competitor[];
      const totalScore = stars.reduce((sum, p) => sum + (p.score || 0), 0);
      return {
        userName: r.user_name.toUpperCase(),
        isLocked: Boolean(r.is_locked || r.device_id === 'LOCKED'),
        starCount: stars.length,
        totalScore,
      };
    });

  if (!squadPillsData.some((s) => s.userName === normalizedActiveUser)) {
    squadPillsData.unshift({
      userName: normalizedActiveUser,
      isLocked,
      starCount: filledStars.length,
      totalScore: userTotalPoints,
    });
  }

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
        
        {/* Row 1: Primary Navigation */}
        <header className="flex-shrink-0 z-40 bg-[#080d1a] border-b-2 border-[#1a264a] w-full shadow-md overflow-x-hidden box-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-3 flex-nowrap overflow-x-hidden box-border">
            
            {/* Left: 🎮 PIXEL PROS */}
            <button
              onClick={() => setCurrentTab('squad')}
              className="touch-manipulation flex items-center gap-1.5 sm:gap-2 cursor-pointer group bg-transparent border-0 p-0 text-left shrink-0"
              title="Return to My Squad"
            >
              <PixelHelmetIcon size={22} color={activeUser?.avatar?.helmetColor || '#155e9e'} />
              <span className="font-pixel text-[11px] sm:text-base text-[#fae5b8] tracking-wider group-hover:text-white transition-colors whitespace-nowrap">
                PIXEL PROS
              </span>
            </button>

            {/* Center: [ MY SQUAD ]  [ COUCH BOARD ] */}
            <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setCurrentTab('squad')}
                className={`touch-manipulation px-2 py-1 sm:px-4 sm:py-1.5 flex items-center justify-center gap-1 sm:gap-1.5 font-pixel text-[10px] sm:text-xs border-2 cursor-pointer transition-all active:translate-y-0.5 ${
                  currentTab === 'squad'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552] hover:bg-[#232e4b] hover:text-[#fae5b8]'
                }`}
                title="My Squad"
              >
                <Users size={13} className={currentTab === 'squad' ? 'text-[#38bdf8]' : ''} />
                <span className="whitespace-nowrap md:hidden">SQUAD</span>
                <span className="whitespace-nowrap hidden md:inline">MY SQUAD</span>
              </button>

              <button
                onClick={() => setCurrentTab('couch')}
                className={`touch-manipulation px-2 py-1 sm:px-4 sm:py-1.5 flex items-center justify-center gap-1 sm:gap-1.5 font-pixel text-[10px] sm:text-xs border-2 cursor-pointer transition-all active:translate-y-0.5 ${
                  currentTab === 'couch'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552] hover:bg-[#232e4b] hover:text-[#fae5b8]'
                }`}
                title="Couch Board"
              >
                <Trophy size={13} className={currentTab === 'couch' ? 'text-[#38bdf8]' : ''} />
                <span className="whitespace-nowrap md:hidden">BOARD</span>
                <span className="whitespace-nowrap hidden md:inline">COUCH BOARD</span>
              </button>
            </nav>

            {/* Right: ROOM: CUSE001 (tap to switch room) and (?) Rules icon */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTempRoomCode(roomCode);
                  setIsRoomModalOpen(true);
                }}
                className="touch-manipulation flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-[#1a2238] hover:bg-[#232e4b] border border-[#273552] hover:border-[#f59e0b] rounded-xs font-pixel text-[9px] sm:text-xs text-[#fae5b8] whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 shadow-xs"
                title="Tap to switch room"
              >
                <span className="text-[#38bdf8]">ROOM:</span>
                <span className="text-[#f59e0b] font-bold">{roomCode}</span>
                <span className="text-[9px] text-[#94a3b8]">✏️</span>
              </button>

              {/* Rules (?) Icon */}
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#1a2238] hover:bg-[#232e4b] text-[#fde047] hover:text-white border-2 border-[#273552] rounded-xs cursor-pointer active:translate-y-0.5 transition-all shadow-xs shrink-0"
                title="How Scoring Works (Rules)"
              >
                <HelpCircle size={15} />
              </button>
            </div>

          </div>
        </header>

        {/* Family Squad Profile Switcher: [ DAD ] [ LEO ] [ VIOLET ] + [ + ADD SQUAD ] */}
        <FamilySquadSwitcher
          activeUserName={userName}
          roomCode={roomCode}
          squads={squadPillsData}
          onSelectSquad={handleSelectSquad}
          onCreateSquad={handleCreateSquad}
        />

        {/* Retro Toast Notification - Positioned safely at bottom on mobile (< 768px), top center on desktop */}
        {toastMessage && (
          <div className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 md:slide-in-from-top-4 fade-in duration-200 pointer-events-none">
            <div className="bg-[#064e3b] text-[#fae5b8] px-3.5 sm:px-4 py-2 border-2 border-[#10b981] rounded-xs font-pixel text-xs shadow-[0_6px_16px_rgba(0,0,0,0.7)] flex items-center justify-center md:justify-start gap-2 whitespace-nowrap text-center">
              <span className="text-sm select-none">⚡</span>
              <span className="font-bold tracking-wide">{toastMessage}</span>
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

          {/* Content Views: Unified max-w-5xl Guide Rails */}
          <div className="relative z-10 max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 box-border">
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
                onSelectSquad={handleSelectSquad}
              />
            )}
          </div>

        </main>

        {/* Footer Info */}
        <footer className="flex-shrink-0 bg-[#080d1a] border-t-2 border-[#1a264a] py-1.5 sm:py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[10px] sm:text-xs font-retro text-[#fae5b8]/75 z-20 box-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full flex items-center justify-center gap-2 whitespace-nowrap box-border">
            <span className="font-bold text-[#fae5b8]">PIXEL PROS</span>
            <span className="text-[#38bdf8]/60 select-none">·</span>
            <span className="text-[#fae5b8]/80">WHOLE NUMBERS ONLY</span>
            <span className="text-[#38bdf8]/60 select-none">·</span>
            <button
              type="button"
              onClick={() => setIsRulesModalOpen(true)}
              className="touch-manipulation hover:underline text-[#fde047] hover:text-white cursor-pointer font-bold transition-colors"
            >
              RULES (?)
            </button>
          </div>
        </footer>

        {/* Simple Rules Pop-up Modal (The 4-Second Cheat Sheet) */}
        {isRulesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-[#0b1021] border-4 border-[#1a264a] shadow-[0_10px_0_0_#050811] p-3.5 sm:p-5 rounded-xs text-[#fae5b8] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#1a264a] pb-2.5 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">📖</span>
                  <h2 className="font-pixel text-xs sm:text-sm text-[#fae5b8] tracking-wider uppercase font-bold">
                    HOW SCORING WORKS
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="touch-manipulation px-2.5 py-1 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center gap-1 font-pixel text-xs cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5 rounded-2xs"
                  title="Close Rules"
                >
                  <span>✕</span>
                  <span>CLOSE</span>
                </button>
              </div>
              <SimpleRulesView />
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
              setDetailedPlayer(null);
              setCurrentTab('squad');
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
                // Target slot is activeSlot if picker was open, or first available slot
                const targetSlot: ActiveSlot = activeSlot || (!squadSlots.star1
                  ? 'star1'
                  : !squadSlots.star2
                  ? 'star2'
                  : !squadSlots.star3
                  ? 'star3'
                  : 'star1');
                handleAssignSlot(player, targetSlot);
                // IMMEDIATELY CLOSE BOTH MODALS & FOCUS ON YOUR 3 NFL STARS
                setDetailedPlayer(null);
                setActiveSlot(null);
                setCurrentTab('squad');
              }}
              onSwapThisStar={() => {
                const slotToSwap: ActiveSlot = occupiedSlot || 'star1';
                setDetailedPlayer(null);
                setActiveSlot(slotToSwap);
              }}
              onDropPlayer={() => {
                if (occupiedSlot) {
                  handleClearSlot(occupiedSlot);
                  setDetailedPlayer(null);
                }
              }}
            />
          );
        })()}

        {/* Quick Room Switcher Modal (Tap-to-switch room) */}
        {isRoomModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="pixel-box-cream p-4 sm:p-5 w-full max-w-sm border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d]">
              <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3">
                <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <span>🛋️</span>
                  <span>SWITCH ROOM</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="touch-manipulation w-6 h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs flex items-center justify-center rounded-2xs border border-[#1a2238] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <p className="font-retro text-xs text-[#784610] mb-2.5">
                Enter room code to join or create a shared family couch board:
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const clean = tempRoomCode.trim().toUpperCase() || 'COUCH';
                  handleCommitRoomCode(clean);
                  setIsRoomModalOpen(false);
                }}
              >
                <input
                  type="text"
                  value={tempRoomCode}
                  onChange={(e) => setTempRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CUSE001"
                  maxLength={12}
                  className="w-full px-3 py-2 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs font-pixel text-sm text-[#451a03] focus:outline-none focus:border-[#12579b] mb-3 text-center uppercase tracking-wider"
                  autoFocus
                />

                {/* Quick Room Suggestions */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  {['COUCH', 'CUSE001', 'SUPERBOWL'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTempRoomCode(r)}
                      className={`px-2 py-0.5 border font-pixel text-[10px] rounded-2xs cursor-pointer active:translate-y-0.5 ${
                        tempRoomCode === r
                          ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                          : 'bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="touch-manipulation flex-1 py-2 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] border-2 border-[#0a2d52] font-pixel text-xs font-bold rounded-xs cursor-pointer shadow-xs active:translate-y-0.5"
                  >
                    JOIN ROOM
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(false)}
                    className="touch-manipulation px-3 py-2 bg-[#784610] hover:bg-[#92400e] text-[#fae5b8] border-2 border-[#451a03] font-pixel text-xs font-bold rounded-xs cursor-pointer active:translate-y-0.5"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
}
