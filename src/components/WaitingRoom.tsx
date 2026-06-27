import { useState } from "react";
import { motion } from "motion/react";
import { Users, Copy, Check, Play, UserCheck, HelpCircle, LogOut } from "lucide-react";
import { Player, ROLE_DETAILS } from "../types";

interface WaitingRoomProps {
  roomCode: string;
  currentPlayerId: string;
  players: Player[];
  maxPlayers: number;
  selectedRoles: string[];
  isHost: boolean;
  onStartGame: () => void;
  onLeaveGame: () => void;
}

export default function WaitingRoom({
  roomCode,
  currentPlayerId,
  players,
  maxPlayers,
  selectedRoles,
  isHost,
  onStartGame,
  onLeaveGame
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlay = players.find(p => p.id === currentPlayerId);
  const isRoomFull = players.length >= maxPlayers;

  // Render a list of active roles in this game
  const activeRolesInGame = selectedRoles.length > 0
    ? selectedRoles.map(id => ROLE_DETAILS[id]).filter(Boolean)
    : [];

  return (
    <div id="waiting-room-root" className="min-h-screen bg-[#FAFAF8] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#111111]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Waiting Area Grid (Left Side - 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Room Info Header */}
          <div className="bg-white border-3 border-[#111111] p-6 shadow-[4px_4px_0px_#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-display text-[10px] bg-[#FF5A1F] text-white border-2 border-[#111111] px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_#111111]">
                Lobby Active
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <h2 className="font-display text-lg text-[#111111]">ROOM CODE:</h2>
                <div className="flex items-center gap-1.5 bg-[#1FDEFF]/10 border-2 border-[#111111] px-3 py-1.5">
                  <span className="font-display text-lg text-[#111111] tracking-wider font-mono">{roomCode}</span>
                  <button onClick={handleCopyCode} className="text-[#111111] hover:text-[#FF5A1F] focus:outline-none cursor-pointer" title="Copy Code">
                    {copied ? <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#fffdf2] border-2 border-[#111111] p-3 shadow-[3px_3px_0px_#111111]">
              <div className="w-10 h-10 border-2 border-[#111111] bg-[#1FDEFF] flex items-center justify-center text-[#111111] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-display text-[#111111] uppercase tracking-wider">PLAYERS IN ROOM</p>
                <p className="text-xl font-display text-[#111111]">
                  {players.length} / <span className="text-[#FF5A1F]">{maxPlayers}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Players Grid */}
          <div className="bg-white border-3 border-[#111111] p-6 shadow-[5px_5px_0px_#111111]">
            <h3 className="font-display text-sm text-[#111111] mb-6 tracking-wider uppercase border-b-2 border-[#111111] pb-2">
              CONNECTED PLAYERS ({players.length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {players.map((player, idx) => {
                const isCurrent = player.id === currentPlayerId;
                
                // Deterministic visual assets
                const hue = (idx * 60) % 360;
                const avatarBg = `hsl(${hue}, 85%, 88%)`;
                const avatarColor = `#111111`;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className={`p-4 border-2 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all shadow-[2px_2px_0px_#111111] ${
                      isCurrent
                        ? 'border-3 border-[#FF5A1F] bg-[#fffdf2] shadow-[3px_3px_0px_#111111]'
                        : 'border-2 border-[#111111] bg-white'
                    }`}
                    id={`player-card-${player.id}`}
                  >
                    {/* Host Badge */}
                    {player.isHost && (
                      <span className="absolute top-2 right-2 text-[8px] font-display bg-[#FF5A1F] text-white border border-[#111111] px-1.5 py-0.5 uppercase tracking-wide shadow-[1px_1px_0px_#111111]">
                        HOST
                      </span>
                    )}

                    {/* Bot Badge */}
                    {player.isBot && (
                      <span className="absolute top-2 left-2 text-[8px] font-display bg-[#1FDEFF] text-[#111111] border border-[#111111] px-1.5 py-0.5 uppercase tracking-wide shadow-[1px_1px_0px_#111111]">
                        AI BOT
                      </span>
                    )}

                    {/* Avatar Icon */}
                    <div
                      className="w-14 h-14 border-2 border-[#111111] flex items-center justify-center font-display text-2xl mb-3 shadow-[2px_2px_0px_#111111] shrink-0"
                      style={{ backgroundColor: avatarBg, color: avatarColor }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <p className="text-sm font-black text-[#111111] truncate max-w-full">
                      {player.name} {isCurrent && <span className="text-xs text-[#FF5A1F]">(You)</span>}
                    </p>
                    
                    <span className="text-[10px] font-display text-emerald-600 tracking-wider uppercase mt-2 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                      <UserCheck className="w-3 h-3 stroke-[3]" />
                      READY
                    </span>
                  </motion.div>
                );
              })}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border-2 border-dashed border-[#111111] bg-slate-100/50 p-4 flex flex-col items-center justify-center text-center text-slate-400 min-h-[140px]"
                >
                  <HelpCircle className="w-8 h-8 mb-2 stroke-[2] opacity-60" />
                  <p className="font-display text-xs tracking-wider">OPEN SLOT</p>
                  <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Waiting...</p>
                </div>
              ))}
            </div>

            {/* Waiting Actions Block */}
            <div className="mt-8 border-t-2 border-[#111111] pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <button
                onClick={onLeaveGame}
                className="w-full sm:w-auto px-5 py-3 border-2 border-[#111111] font-display text-xs uppercase tracking-wider text-[#111111] bg-white shadow-[2px_2px_0px_#111111] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#111111] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111111] flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="lobby-leave-btn"
              >
                <LogOut className="w-4 h-4 text-[#FF5A1F] stroke-[3]" />
                Leave Room
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-stretch">
                {isHost ? (
                  <motion.button
                    whileHover={isRoomFull ? { scale: 1.02 } : {}}
                    whileTap={isRoomFull ? { scale: 0.98 } : {}}
                    disabled={!isRoomFull}
                    onClick={onStartGame}
                    className={`px-8 py-3.5 border-3 border-[#111111] font-display text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#111111] transition-all cursor-pointer ${
                      isRoomFull
                        ? 'bg-[#1FDEFF] text-[#111111] hover:bg-[#00D0FF]'
                        : 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
                    }`}
                    id="host-start-game-btn"
                  >
                    <Play className="w-4 h-4 stroke-[3]" />
                    Start Game
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-display text-[#FF5A1F] bg-[#fffdf2] border-2 border-[#111111] py-2 px-4 shadow-[2px_2px_0px_#111111] animate-pulse">
                    <span>Waiting for Host to Start...</span>
                  </div>
                )}
              </div>
            </div>

            {isHost && !isRoomFull && (
              <p className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-wider text-right mt-3">
                * Note: The room must be fully joined by {maxPlayers} players before starting.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Info Area (Right Side - 1 Col) */}
        <div className="space-y-6">
          
          {/* My Secret Card Notice */}
          <div className="bg-[#111111] text-white border-3 border-[#111111] p-6 shadow-[5px_5px_0px_#FF5A1F]">
            <p className="font-display text-[9px] text-[#1FDEFF] tracking-widest uppercase mb-1">Your Identity</p>
            <h4 className="text-2xl font-display uppercase tracking-tight">{currentPlay?.name}</h4>
            
            <div className="my-6 border-y border-slate-800 py-6 text-center">
              <div className="w-16 h-16 border-2 border-[#111111] bg-[#FF5A1F] text-white flex items-center justify-center font-display text-3xl mx-auto shadow-[3px_3px_0px_#1FDEFF]">
                ?
              </div>
              <h5 className="font-display text-xs text-white mt-4 uppercase tracking-wider">SECRET ROLE</h5>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-bold">
                Roles are distributed randomly on start. You will discover your character once the host triggers the start!
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 text-xs text-slate-300 leading-relaxed font-bold">
              <p className="font-display text-[10px] text-[#FF5A1F] mb-1 uppercase tracking-wider">🎮 How to play:</p>
              During the **Night**, players with special abilities execute secret actions. Civilians "sleep" and play mini-games. During the **Day**, discuss who behaves suspiciously and vote out suspects.
            </div>
          </div>

          {/* Special Active Roles Block */}
          <div className="bg-white border-3 border-[#111111] p-6 shadow-[4px_4px_0px_#111111]">
            <h4 className="font-display text-xs text-[#111111] mb-4 uppercase tracking-wider border-b-2 border-[#111111] pb-2 flex items-center justify-between">
              <span>ACTIVE SPECIAL ROLES</span>
              <span className="text-[10px] font-display bg-[#111111] text-[#1FDEFF] px-2.5 py-0.5 border border-[#111111]">
                {activeRolesInGame.length} Included
              </span>
            </h4>

            {activeRolesInGame.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold italic">
                No special roles are active. Standard Civilian vs Mafia game!
              </p>
            ) : (
              <div className="space-y-4">
                {activeRolesInGame.map(role => (
                  <div key={role.id} className="flex gap-3 items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 border border-[#111111] bg-gradient-to-br ${role.imageColor} shrink-0 flex items-center justify-center text-white font-display text-xs`}>
                      {role.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-display uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                        {role.name}
                        <span className="text-[8px] font-display px-1.5 bg-[#fffdf2] border border-[#111111] text-[#111111]">
                          {role.team}
                        </span>
                      </h5>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug font-bold">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
