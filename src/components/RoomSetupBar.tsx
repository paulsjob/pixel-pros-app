import React from 'react';
import { Users, Radio } from 'lucide-react';

interface RoomSetupBarProps {
  userName: string;
  roomCode: string;
  onUserNameChange: (name: string) => void;
  onRoomCodeChange: (code: string) => void;
  memberCount?: number;
}

export const RoomSetupBar: React.FC<RoomSetupBarProps> = ({
  userName,
  roomCode,
  onUserNameChange,
  onRoomCodeChange,
  memberCount,
}) => {
  return (
    <div className="w-full bg-[#080d1a] border-3 border-[#1a264a] shadow-[0_4px_0_0_#050811] p-2 sm:p-2.5 mb-3 sm:mb-4 rounded-xs box-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        
        {/* Inputs: NAME and ROOM */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* NAME INPUT */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <label htmlFor="user-name-input" className="font-pixel text-[10px] sm:text-xs text-[#38bdf8] whitespace-nowrap">
              NAME:
            </label>
            <input
              id="user-name-input"
              type="text"
              value={userName}
              onChange={(e) => onUserNameChange(e.target.value)}
              placeholder="e.g. Dad"
              maxLength={14}
              className="bg-[#1a2238] border-2 border-[#273552] text-[#fae5b8] font-pixel text-[11px] sm:text-xs px-2 py-1 rounded-2xs focus:border-[#38bdf8] focus:outline-none w-full sm:w-32 uppercase"
            />
          </div>

          {/* ROOM INPUT */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <label htmlFor="room-code-input" className="font-pixel text-[10px] sm:text-xs text-[#f59e0b] whitespace-nowrap">
              ROOM:
            </label>
            <input
              id="room-code-input"
              type="text"
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
              placeholder="COUCH"
              maxLength={10}
              className="bg-[#1a2238] border-2 border-[#273552] text-[#fae5b8] font-pixel text-[11px] sm:text-xs px-2 py-1 rounded-2xs focus:border-[#f59e0b] focus:outline-none w-full sm:w-28 uppercase"
            />
          </div>
        </div>

        {/* Live Multi-Device Sync Indicator */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-[10px] font-pixel">
          {memberCount !== undefined && (
            <div className="flex items-center gap-1 text-[#93c5fd] font-retro text-xs">
              <Users size={13} className="text-[#38bdf8]" />
              <span>{memberCount} ON COUCH</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#12579b]/40 border border-[#12579b] text-[#38bdf8] rounded-2xs whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
            <span className="text-[9px] sm:text-[10px]">LIVE SYNC</span>
          </div>
        </div>

      </div>
    </div>
  );
};
