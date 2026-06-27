import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Users, ShieldAlert, Timer, HelpCircle, UserPlus, Info, Check } from "lucide-react";
import { ROLE_DETAILS } from "../types";

interface MafiaLobbyProps {
  onBack: () => void;
  onCreateGame: (config: {
    playerName: string;
    maxPlayers: number;
    selectedRoles: string[];
    discussionTime: number;
    votingTime: number;
    mafiaCount?: number;
  }) => void;
  onJoinGame: (playerName: string, roomCode: string) => void;
}

export default function MafiaLobby({ onBack, onCreateGame, onJoinGame }: MafiaLobbyProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['doctor', 'detective']);
  const [mafiaCount, setMafiaCount] = useState(1);
  const [discussionTime, setDiscussionTime] = useState(60);
  const [votingTime, setVotingTime] = useState(30);
  const [error, setError] = useState('');

  // Calculate dynamic maximum special roles based on player count N
  const getSpecialRolesLimit = (N: number): number => {
    if (N <= 4) return 0;
    if (N >= 5 && N <= 6) return 2;
    if (N >= 7 && N <= 8) return 3;
    if (N === 9) return 4;
    if (N >= 10 && N <= 11) return 5;
    if (N >= 12) return 6;
    return 2;
  };

  const currentLimit = getSpecialRolesLimit(maxPlayers);

  // Automatically adjust selected roles and mafia count if maxPlayers changes
  useEffect(() => {
    // 1. Calculate and set default Mafia count
    let defaultMafia = 1;
    if (maxPlayers >= 6 && maxPlayers <= 8) defaultMafia = 2;
    else if (maxPlayers >= 9 && maxPlayers <= 11) defaultMafia = 3;
    else if (maxPlayers >= 12) defaultMafia = 4;
    setMafiaCount(defaultMafia);

    // 2. Adjust selectedRoles if limit is exceeded for classic selection
    const limit = getSpecialRolesLimit(maxPlayers);
    if (selectedRoles.length > limit) {
      setSelectedRoles(selectedRoles.slice(0, limit));
    }
  }, [maxPlayers]);

  const handleRoleToggle = (roleId: string) => {
    const limit = getSpecialRolesLimit(maxPlayers);
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleId));
    } else {
      if (selectedRoles.length < limit) {
        setSelectedRoles([...selectedRoles, roleId]);
      }
    }
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setError('');

    onCreateGame({
      playerName: playerName.trim(),
      maxPlayers,
      selectedRoles: selectedRoles,
      discussionTime,
      votingTime,
      mafiaCount
    });
  };

  const handleJoinSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError("Please enter a valid 6-character code");
      return;
    }
    setError('');
    onJoinGame(playerName.trim(), roomCode.trim().toUpperCase());
  };

  const roleList = [
    { id: 'doctor', name: 'Doctor', desc: ROLE_DETAILS.doctor.description, ability: ROLE_DETAILS.doctor.ability, bg: ROLE_DETAILS.doctor.imageColor },
    { id: 'detective', name: 'Detective', desc: ROLE_DETAILS.detective.description, ability: ROLE_DETAILS.detective.ability, bg: ROLE_DETAILS.detective.imageColor },
    { id: 'vigilante', name: 'Vigilante', desc: ROLE_DETAILS.vigilante.description, ability: ROLE_DETAILS.vigilante.ability, bg: ROLE_DETAILS.vigilante.imageColor },
    { id: 'serial_killer', name: 'Serial Killer', desc: ROLE_DETAILS.serial_killer.description, ability: ROLE_DETAILS.serial_killer.ability, bg: ROLE_DETAILS.serial_killer.imageColor },
    { id: 'jester', name: 'Jester', desc: ROLE_DETAILS.jester.description, ability: ROLE_DETAILS.jester.ability, bg: ROLE_DETAILS.jester.imageColor },
    { id: 'godmother', name: 'Godmother', desc: ROLE_DETAILS.godmother.description, ability: ROLE_DETAILS.godmother.ability, bg: ROLE_DETAILS.godmother.imageColor },
  ];

  return (
    <div id="mafia-lobby-root" className="min-h-screen bg-[#FAFAF8] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#111111]">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button and Game Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <button
            onClick={onBack}
            className="self-start flex items-center gap-2 font-display text-sm uppercase tracking-wider text-[#111111] bg-white border-3 border-[#111111] shadow-[3px_3px_0px_#111111] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#111111] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111111] px-4 py-2 transition-all cursor-pointer"
            id="lobby-back-button"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF5A1F] stroke-[3]" />
            Game Catalog
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-display text-xs bg-[#111111] text-white border-2 border-[#111111] px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_#1FDEFF]">
              SOCIAL DEDUCTION
            </span>
            <span className="font-display text-2xl tracking-wider text-[#111111]">
              MAFIA.EXE
            </span>
          </div>
        </div>

        {/* Primary Tab Controls */}
        <div className="grid grid-cols-2 gap-4 bg-white p-2 border-3 border-[#111111] shadow-[4px_4px_0px_#111111] mb-8">
          <button
            onClick={() => { setTab('create'); setError(''); }}
            className={`py-3.5 font-display text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
              tab === 'create'
                ? 'bg-[#FF5A1F] text-white border-[#111111] shadow-[2px_2px_0px_#111111]'
                : 'text-[#111111] border-transparent hover:border-[#111111] hover:bg-slate-50'
            }`}
            id="lobby-tab-create"
          >
            <UserPlus className="w-4 h-4" />
            Create Game
          </button>
          <button
            onClick={() => { setTab('join'); setError(''); }}
            className={`py-3.5 font-display text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
              tab === 'join'
                ? 'bg-[#FF5A1F] text-white border-[#111111] shadow-[2px_2px_0px_#111111]'
                : 'text-[#111111] border-transparent hover:border-[#111111] hover:bg-slate-50'
            }`}
            id="lobby-tab-join"
          >
            <Users className="w-4 h-4" />
            Join Game
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-3 border-[#111111] text-[#111111] p-4 shadow-[4px_4px_0px_#111111] mb-8 font-black text-xs uppercase tracking-wider flex items-center gap-3"
          >
            <Info className="w-5 h-5 text-[#FF5A1F] shrink-0 stroke-[3]" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Forms Container */}
        <div className="bg-white border-3 border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111]">
          
          {/* Rotating Slogan Title Header */}
          <div className="border-3 border-[#111111] bg-[#FF5A1F] p-4 transform -rotate-1 shadow-[4px_4px_0px_#111111] mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-display text-white uppercase leading-none tracking-tight">
              {tab === 'create' ? "MAFIA LOBBY SETUP" : "ENTER SECURE ROOM"}
            </h1>
          </div>

          <div className="mb-6">
            <label htmlFor="player-name" className="block font-display text-xs text-[#111111] mb-2 uppercase tracking-widest">
              YOUR PLAYER NAME
            </label>
            <input
              type="text"
              id="player-name"
              placeholder="e.g. NightRaven_92"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.substring(0, 15))}
              className="w-full bg-white border-2 border-[#111111] focus:bg-[#fffdf2] focus:outline-none px-4 py-3 font-bold text-[#111111] placeholder-slate-400 text-base"
            />
          </div>

          <AnimatePresence mode="wait">
            {tab === 'create' ? (
              <motion.form
                key="create"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleCreateSubmit}
                className="space-y-6"
                id="create-game-form"
              >
                {/* Player Count Selector */}
                <div className="bg-[#fffdf2] border-3 border-[#111111] p-5 shadow-[4px_4px_0px_#111111]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <label htmlFor="player-count" className="font-display text-xs text-[#111111] flex items-center gap-1.5 uppercase tracking-wider">
                      <Users className="w-4 h-4 text-[#FF5A1F]" />
                      Total Players In Lobby
                    </label>
                    <span className="font-display text-2xl text-white bg-[#111111] border-2 border-[#111111] px-4 py-1 shadow-[2px_2px_0px_#1FDEFF]">
                      {maxPlayers < 10 ? `0${maxPlayers}` : maxPlayers}
                    </span>
                  </div>
                  
                  {/* Plus Minus count box from Design HTML */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMaxPlayers(prev => Math.max(4, prev - 1))}
                      className="w-10 h-10 border-2 border-[#111111] bg-white font-display text-xl text-[#111111] flex items-center justify-center cursor-pointer hover:bg-slate-100"
                    >
                      -
                    </button>
                    <div className="font-display text-3xl w-14 text-center">
                      {maxPlayers}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaxPlayers(prev => Math.min(20, prev + 1))}
                      className="w-10 h-10 border-2 border-[#111111] bg-white font-display text-xl text-[#111111] flex items-center justify-center cursor-pointer hover:bg-slate-100"
                    >
                      +
                    </button>
                    <span className="font-black text-xs uppercase tracking-wider text-[#111111] opacity-70 ml-2">Use Buttons or Slider</span>
                  </div>

                  <input
                    type="range"
                    id="player-count"
                    min="4"
                    max="20"
                    step="1"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-300 rounded-none appearance-none cursor-pointer accent-[#FF5A1F] mt-4"
                  />
                  <div className="flex justify-between text-[10px] text-[#111111] font-extrabold mt-1 uppercase">
                    <span>4 Min</span>
                    <span>8 Medium</span>
                    <span>12 High</span>
                    <span>20 Max</span>
                  </div>
                </div>

                {/* Mafia Count Selector */}
                <div className="bg-[#fffdf2] border-3 border-[#111111] p-5 shadow-[4px_4px_0px_#111111]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <label className="font-display text-xs text-[#111111] flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-[#FF5A1F]" />
                      Number of Mafia Members
                    </label>
                    <span className="font-display text-2xl text-white bg-[#111111] border-2 border-[#111111] px-4 py-1 shadow-[2px_2px_0px_#1FDEFF]">
                      {mafiaCount < 10 ? `0${mafiaCount}` : mafiaCount}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={maxPlayers <= 4}
                      onClick={() => setMafiaCount(prev => Math.max(1, prev - 1))}
                      className={`w-10 h-10 border-2 border-[#111111] font-display text-xl text-[#111111] flex items-center justify-center cursor-pointer ${maxPlayers <= 4 ? 'bg-slate-100 opacity-55 cursor-not-allowed' : 'bg-white hover:bg-slate-100'}`}
                    >
                      -
                    </button>
                    <div className="font-display text-3xl w-14 text-center">
                      {mafiaCount}
                    </div>
                    <button
                      type="button"
                      disabled={maxPlayers <= 4 || mafiaCount >= Math.max(1, Math.floor(maxPlayers / 2))}
                      onClick={() => setMafiaCount(prev => Math.min(Math.max(1, Math.floor(maxPlayers / 2)), prev + 1))}
                      className={`w-10 h-10 border-2 border-[#111111] font-display text-xl text-[#111111] flex items-center justify-center cursor-pointer ${maxPlayers <= 4 || mafiaCount >= Math.max(1, Math.floor(maxPlayers / 2)) ? 'bg-slate-100 opacity-55 cursor-not-allowed' : 'bg-white hover:bg-slate-100'}`}
                    >
                      +
                    </button>
                    <span className="font-black text-xs uppercase tracking-wider text-[#111111] opacity-70 ml-2">
                      {maxPlayers <= 4 ? "Locked to 1 for 4 players" : `Min 1, Max ${Math.floor(maxPlayers / 2)}`}
                    </span>
                  </div>
                </div>

                {/* Roles Selector & Breakdown */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b-2 border-[#111111] pb-2">
                    <div>
                      <label className="font-display text-xs text-[#111111] flex items-center gap-1.5 uppercase tracking-widest">
                        <ShieldAlert className="w-4 h-4 text-[#FF5A1F]" />
                        Active Special Roles
                      </label>
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase mt-0.5">
                        Autobalanced with Civilians and Mafia
                      </p>
                    </div>
                    
                    <span className="font-display text-xs bg-[#111111] text-[#1FDEFF] border-2 border-[#111111] px-3 py-1 shadow-[2px_2px_0px_#111111]">
                      {selectedRoles.length} / {currentLimit} SPECIAL ACTIVE
                    </span>
                  </div>

                  {maxPlayers === 4 ? (
                    <div className="bg-[#fffdf2] border-2 border-[#111111] p-4 text-xs font-bold text-[#111111] flex items-start gap-2 shadow-[2px_2px_0px_#111111]">
                      <HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#FF5A1F] stroke-[3]" />
                      <span className="uppercase tracking-wider">4 Player games are high-stakes duels and only feature 1 Mafia member vs 3 Innocent Civilians. No special abilities are allowed.</span>
                    </div>
                  ) : (
                    <div>
                      {/* Interactive limit helper */}
                      <p className="text-[10px] font-display text-white uppercase bg-[#111111] border-2 border-[#111111] py-1.5 px-3 shadow-[2px_2px_0px_#FF5A1F] mb-4 inline-flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#1FDEFF]" />
                        LIMIT: {currentLimit} SPECIAL ROLES ACTIVE
                      </p>

                      {/* Roles Checklist */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {roleList.map((role) => {
                          const isChecked = selectedRoles.includes(role.id);
                          const isDisabled = !isChecked && selectedRoles.length >= currentLimit;

                          return (
                            <div
                              key={role.id}
                              onClick={() => !isDisabled && handleRoleToggle(role.id)}
                              className={`border-2 p-4 transition-all relative overflow-hidden select-none ${
                                isDisabled 
                                  ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                                  : isChecked
                                    ? 'border-3 border-[#111111] bg-[#f0fff0] cursor-pointer shadow-[3px_3px_0px_#111111]'
                                    : 'border-2 border-[#111111] bg-white hover:bg-slate-50 cursor-pointer shadow-[2px_2px_0px_#111111]'
                              }`}
                              id={`role-box-${role.id}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex gap-2.5 items-center">
                                  <div className={`w-8 h-8 border-2 border-[#111111] bg-gradient-to-br ${role.bg} flex items-center justify-center font-display text-white text-xs shrink-0`}>
                                    {role.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-display uppercase tracking-wider text-[#111111]">{role.name}</h3>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 border-2 border-[#111111] flex items-center justify-center transition-all ${
                                  isChecked 
                                    ? 'bg-[#1FDEFF]' 
                                    : 'bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3.5 h-3.5 text-[#111111] stroke-[4]" />}
                                </div>
                              </div>
                              <p className="text-xs text-slate-700 mt-2 font-bold leading-relaxed">
                                {role.desc}
                              </p>
                              <div className="mt-2 bg-white border border-[#111111] p-2">
                                <p className="text-[9px] text-[#111111] font-display uppercase tracking-widest">ABILITY:</p>
                                <p className="text-[11px] text-[#111111] mt-0.5 leading-snug font-bold">{role.ability}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timers Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label htmlFor="discussion-timer" className="block font-display text-xs text-[#111111] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                      <Timer className="w-4 h-4 text-[#FF5A1F]" />
                      DISCUSSION TIME
                    </label>
                    <select
                      id="discussion-timer"
                      value={discussionTime}
                      onChange={(e) => setDiscussionTime(parseInt(e.target.value))}
                      className="w-full bg-white border-2 border-[#111111] px-4 py-3 font-bold text-[#111111] focus:outline-none focus:bg-[#fffdf2] shadow-[2px_2px_0px_#111111]"
                    >
                      <option value="15">15 Seconds (Lightning)</option>
                      <option value="30">30 Seconds (Fast)</option>
                      <option value="60">60 Seconds (Standard)</option>
                      <option value="90">90 Seconds (Analytical)</option>
                      <option value="120">120 Seconds (Extended)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="voting-timer" className="block font-display text-xs text-[#111111] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                      <Timer className="w-4 h-4 text-[#FF5A1F]" />
                      VOTING TIME
                    </label>
                    <select
                      id="voting-timer"
                      value={votingTime}
                      onChange={(e) => setVotingTime(parseInt(e.target.value))}
                      className="w-full bg-white border-2 border-[#111111] px-4 py-3 font-bold text-[#111111] focus:outline-none focus:bg-[#fffdf2] shadow-[2px_2px_0px_#111111]"
                    >
                      <option value="15">15 Seconds (Quick)</option>
                      <option value="30">30 Seconds (Standard)</option>
                      <option value="45">45 Seconds (Pondering)</option>
                      <option value="60">60 Seconds (Full Debate)</option>
                    </select>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full bg-[#1FDEFF] hover:bg-[#00D0FF] text-[#111111] py-4 border-3 border-[#111111] font-display text-base tracking-widest uppercase shadow-[5px_5px_0px_#111111] transition-all cursor-pointer"
                    id="create-room-btn"
                  >
                    Create Room & Get Role
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="join"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleJoinSubmit}
                className="space-y-6"
                id="join-game-form"
              >
                <div>
                  <label htmlFor="room-code" className="block font-display text-xs text-[#111111] mb-2 uppercase tracking-widest">
                    6-DIGIT ROOM CODE
                  </label>
                  <input
                    type="text"
                    id="room-code"
                    placeholder="E.G. AB34X9"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6))}
                    className="w-full bg-white border-2 border-[#111111] px-4 py-4 text-center font-display tracking-widest text-2xl text-[#111111] placeholder-slate-400 focus:outline-none focus:bg-[#fffdf2] uppercase shadow-[2px_2px_0px_#111111]"
                  />
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase mt-3">
                    Ask the room creator for their unique 6-character room code to join.
                  </p>
                </div>

                <div className="pt-6">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full bg-[#1FDEFF] hover:bg-[#00D0FF] text-[#111111] py-4 border-3 border-[#111111] font-display text-base tracking-widest uppercase shadow-[5px_5px_0px_#111111] transition-all cursor-pointer"
                    id="join-room-btn"
                  >
                    Enter Lobby
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Capacity Logic Info Section from Design HTML */}
        <div className="bg-[#fffdf2] border-3 border-[#111111] p-6 shadow-[4px_4px_0px_#111111] mt-8">
          <h4 className="font-display text-sm uppercase tracking-wider mb-3 text-[#111111]">Lobby Capacity Logic</h4>
          <ul className="text-xs space-y-1.5 text-[#111111] font-bold uppercase tracking-wide list-disc list-inside">
            <li>4 PLAYERS: STRICTLY 1 MAFIA, 3 CIVILIANS (NO SPECIALS)</li>
            <li>5-20 PLAYERS: CUSTOMISABLE MAFIA COUNT, SPECIALS LIMIT CAP ENFORCED (UP TO 6 SPECIALS ACTIVE)</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
