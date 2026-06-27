import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Eye, ShieldAlert, CheckCircle, MessageSquare, Send, Shield, Swords, Sparkles } from "lucide-react";
import { GameState, ROLE_DETAILS } from "../types";

interface NightPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onSendChat: (text: string, isMafiaOnly: boolean) => void;
  onGameAction: (actionType: string, targetId: string | null) => void;
}

export default function NightPhase({
  gameState,
  currentPlayerId,
  onSendChat,
  onGameAction
}: NightPhaseProps) {
  const [chatInput, setChatInput] = useState('');
  const [miniGameTargetIndex, setMiniGameTargetIndex] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);

  const me = gameState.players.find(p => p.id === currentPlayerId);
  if (!me) return null;

  const currentPhase = gameState.status; // e.g. 'night_mafia', 'night_doctor', etc.
  
  // Decide what item sleeping players are searching for
  let miniGameTargetItem = "🦆";
  let miniGameTargetLabel = "the Picture of a Duck";

  if (currentPhase === 'night_doctor') {
    miniGameTargetItem = "✏️";
    miniGameTargetLabel = "a Pencil";
  } else if (currentPhase === 'night_detective') {
    miniGameTargetItem = "📱";
    miniGameTargetLabel = "a Mobile Phone";
  } else if (currentPhase === 'night_vigilante') {
    miniGameTargetItem = "✏️";
    miniGameTargetLabel = "a Pencil";
  } else if (currentPhase === 'night_serial_killer') {
    miniGameTargetItem = "✏️";
    miniGameTargetLabel = "a Pencil";
  }

  // Determine if I am active during this specific phase
  const isMyActivePhase =
    (currentPhase === 'night_mafia' && (me.role === 'mafia' || me.role === 'godmother')) ||
    (currentPhase === 'night_doctor' && me.role === 'doctor') ||
    (currentPhase === 'night_detective' && me.role === 'detective') ||
    (currentPhase === 'night_vigilante' && me.role === 'vigilante') ||
    (currentPhase === 'night_serial_killer' && me.role === 'serial_killer');

  // Regenerate mini-game card targets when phase changes
  useEffect(() => {
    setRevealedIndices([]);
    setShakeIndex(null);
    setMiniGameTargetIndex(Math.floor(Math.random() * 8));
  }, [currentPhase]);

  const handleMiniGameClick = (idx: number) => {
    if (me.hasDoneMiniGame) return;
    if (revealedIndices.includes(idx)) return;

    if (idx === miniGameTargetIndex) {
      setRevealedIndices([...revealedIndices, idx]);
      // Success! Notify server
      setTimeout(() => {
        onGameAction('mini_game_complete', null);
      }, 800);
    } else {
      setRevealedIndices([...revealedIndices, idx]);
      setShakeIndex(idx);
      setTimeout(() => setShakeIndex(null), 500);
    }
  };

  const handleActionClick = (targetId: string | null) => {
    let actionType = '';
    if (currentPhase === 'night_mafia') actionType = 'mafia_kill';
    else if (currentPhase === 'night_doctor') actionType = 'doctor_save';
    else if (currentPhase === 'night_detective') actionType = 'detective_inspect';
    else if (currentPhase === 'night_vigilante') actionType = 'vigilante_shoot';
    else if (currentPhase === 'night_serial_killer') actionType = 'serial_killer_kill';

    if (actionType) {
      onGameAction(actionType, targetId);
    }
  };

  const handleSendChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim(), true); // Send as private Mafia chat
    setChatInput('');
  };

  // Filter players list for night targeting
  // Generally, targets are other living players.
  // Exception: Doctor can target anyone (including themselves, unless they already healed themselves)
  let targetablePlayers = gameState.players.filter(p => p.isAlive);
  
  if (currentPhase === 'night_mafia') {
    // Mafias cannot target fellow Mafias
    targetablePlayers = targetablePlayers.filter(p => p.role !== 'mafia' && p.role !== 'godmother');
  } else if (currentPhase === 'night_doctor') {
    // If Doctor already healed themselves, they cannot heal themselves again
    if (gameState.currentPlayerSelfHealUsed) {
      targetablePlayers = targetablePlayers.filter(p => p.id !== me.id);
    }
  } else {
    // Others cannot target themselves
    targetablePlayers = targetablePlayers.filter(p => p.id !== me.id);
  }

  return (
    <div id="night-phase-root" className="min-h-screen bg-[#111111] text-[#111111] py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Decorative Night Stars Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute top-12 left-1/4 w-2 h-2 bg-[#1FDEFF] rounded-none rotate-45 animate-pulse"></div>
        <div className="absolute top-24 right-1/3 w-3 h-3 bg-[#FF5A1F] rounded-none rotate-12 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white rounded-none rotate-45 animate-pulse"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Night Header Status Bar */}
        <div className="bg-white border-3 border-[#111111] p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 shadow-[4px_4px_0px_#1FDEFF]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-2 border-[#111111] bg-[#FF5A1F] flex items-center justify-center text-white shadow-[2px_2px_0px_#111111]">
              <Moon className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <p className="font-display text-xs text-[#FF5A1F] tracking-wider uppercase">NIGHT PHASE — DAY 0{gameState.dayCount}</p>
              <h2 className="text-2xl font-display uppercase tracking-tight text-[#111111]">The village sleeps...</h2>
            </div>
          </div>
          
          <div className="text-center md:text-right bg-[#fffdf2] border-2 border-[#111111] px-4 py-2 shadow-[2px_2px_0px_#111111]">
            <p className="text-[9px] font-display text-slate-500 uppercase tracking-wider">CURRENT SECRET TURN</p>
            <span className="text-sm font-display text-[#111111] uppercase">
              {currentPhase.replace('night_', '').replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Night Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Phase Interactive Panel (2 cols) */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {isMyActivePhase ? (
                <motion.div
                  key="active-action"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white border-3 border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#FF5A1F]"
                >
                  {/* Action Banner */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-12 h-12 border-2 border-[#111111] bg-[#1FDEFF] flex items-center justify-center text-[#111111] shadow-[2px_2px_0px_#111111]">
                      <Eye className="w-6 h-6 stroke-[3]" />
                    </span>
                    <div>
                      <h3 className="text-xl font-display uppercase text-[#111111] tracking-wider">Secret Operations</h3>
                      <p className="text-xs text-[#FF5A1F] font-black uppercase tracking-wider">
                        Your secret role ({ROLE_DETAILS[me.role]?.name}) is active!
                      </p>
                    </div>
                  </div>

                  <div className="text-[#111111] font-bold text-sm mb-6 leading-relaxed bg-[#fffdf2] p-4 border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
                    <span className="font-display text-xs text-[#FF5A1F] block mb-1 uppercase tracking-wider">Your Nightly Action:</span> {ROLE_DETAILS[me.role]?.ability}
                  </div>

                  {/* Already Voted / Action Locked */}
                  {me.hasVoted ? (
                    <div className="bg-[#fffdf2] border-3 border-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[300px] shadow-[4px_4px_0px_#111111]">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 border-2 border-[#111111] bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-[2px_2px_0px_#111111]"
                      >
                        <CheckCircle className="w-8 h-8 stroke-[3]" />
                      </motion.div>
                      <h4 className="text-xl font-display text-[#111111] uppercase">Choice Registered</h4>
                      <p className="text-slate-700 text-xs mt-2 max-w-sm font-bold uppercase tracking-wide">
                        Your secret action is logged safely. Waiting for other active roles and sleeping players to finish their turns...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-display text-xs text-slate-500 mb-4 tracking-wider uppercase">
                        CHOOSE A TARGET FROM THE VILLAGE:
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {targetablePlayers.map((target) => (
                          <motion.div
                            key={target.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleActionClick(target.id)}
                            className="p-4 bg-white border-2 border-[#111111] hover:bg-amber-50 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-[3px_3px_0px_#111111]"
                            id={`night-target-${target.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 border-2 border-[#111111] bg-[#1FDEFF]/15 flex items-center justify-center text-sm font-display text-[#111111]">
                                {target.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-[#111111]">{target.name}</p>
                                <p className="text-[9px] text-slate-500 font-extrabold uppercase">LIVING ALLY</p>
                              </div>
                            </div>
                            
                            <span className="font-display text-[9px] bg-[#FF5A1F] text-white border border-[#111111] px-2.5 py-1 uppercase tracking-wider shadow-[1px_1px_0px_#111111]">
                              TARGET
                            </span>
                          </motion.div>
                        ))}

                        {/* Vigilante Specific Skip Button */}
                        {currentPhase === 'night_vigilante' && (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleActionClick(null)}
                            className="p-4 bg-white border-2 border-dashed border-[#111111] hover:bg-[#fffdf2] rounded-none cursor-pointer transition-all flex items-center justify-center text-center font-display text-xs uppercase tracking-wider text-slate-600 shadow-[2px_2px_0px_#111111]"
                            id="night-target-skip"
                          >
                            <span>Hold Fire (Skip Night Action)</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="sleeper-game"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white border-3 border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#1FDEFF]"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-12 h-12 border-2 border-[#111111] bg-[#fffdf2] flex items-center justify-center text-[#FF5A1F] shadow-[2px_2px_0px_#111111]">
                      <Moon className="w-6 h-6 stroke-[3]" />
                    </span>
                    <div>
                      <h3 className="text-xl font-display uppercase text-[#111111] tracking-wider">You are Sleeping</h3>
                      <p className="text-xs text-[#FF5A1F] font-black uppercase tracking-wider">
                        Secret operations are in progress...
                      </p>
                    </div>
                  </div>

                  <p className="text-[#111111] font-bold text-sm mb-6 leading-relaxed">
                    The active special players are executing their secret actions. To ensure a deep and restful sleep, click on the cards below to find <span className="text-[#FF5A1F] font-extrabold">{miniGameTargetLabel}</span>!
                  </p>

                  {me.hasDoneMiniGame ? (
                    <div className="bg-[#fffdf2] border-3 border-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[300px] shadow-[4px_4px_0px_#111111]">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 border-2 border-[#111111] bg-[#1FDEFF]/10 text-[#111111] flex items-center justify-center mb-4 shadow-[2px_2px_0px_#111111]"
                      >
                        <CheckCircle className="w-8 h-8 stroke-[3]" />
                      </motion.div>
                      <h4 className="text-xl font-display text-[#111111] uppercase">Sleeping Peacefully</h4>
                      <p className="text-slate-700 text-xs mt-2 max-w-sm font-bold uppercase tracking-wider leading-relaxed">
                        Task completed! Your sleep is deep and undisturbed. Waiting for active operations to wrap up...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-display text-xs text-slate-500 mb-6 tracking-wider uppercase text-center">
                        FLIP THE CARDS TO FIND {miniGameTargetItem}:
                      </h4>

                      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                        {Array.from({ length: 8 }).map((_, idx) => {
                          const isRevealed = revealedIndices.includes(idx);
                          const isCorrect = idx === miniGameTargetIndex;
                          const isShaking = shakeIndex === idx;

                          return (
                            <motion.div
                              key={idx}
                              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                              transition={{ duration: 0.4 }}
                              onClick={() => handleMiniGameClick(idx)}
                              className={`aspect-square flex items-center justify-center border-2 text-2xl font-bold cursor-pointer transition-all select-none shadow-[2px_2px_0px_#111111] ${
                                isRevealed
                                  ? isCorrect
                                    ? 'bg-[#1FDEFF]/20 border-3 border-[#111111] text-white'
                                    : 'bg-slate-100 border-[#111111] text-slate-600'
                                  : 'bg-[#fffdf2] hover:bg-[#fffbe5] border-[#111111] text-[#111111]'
                              }`}
                              id={`sleep-card-${idx}`}
                            >
                              {isRevealed ? (
                                isCorrect ? miniGameTargetItem : "☁️"
                              ) : (
                                "💤"
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Chat / Reports Panel (1 col) */}
          <div className="space-y-6">
            
            {/* Private Mafia chat panel (Only shown to Mafia team during night) */}
            {(me.role === 'mafia' || me.role === 'godmother') ? (
              <div className="bg-white border-3 border-[#111111] p-5 flex flex-col h-[420px] shadow-[5px_5px_0px_#FF5A1F] relative overflow-hidden">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-[#111111] shrink-0">
                  <span className="w-3 h-3 rounded-none bg-[#FF5A1F] animate-pulse"></span>
                  <MessageSquare className="w-4 h-4 text-slate-700" />
                  <h4 className="font-display text-xs text-[#111111] tracking-wider uppercase">MAFIA PRIVATE CHAT</h4>
                </div>

                {/* Secret Messages Log */}
                <div className="flex-grow overflow-y-auto py-3 space-y-3 pr-1 text-xs font-bold">
                  {gameState.messages
                    .filter(m => m.isMafiaOnly)
                    .map((msg, i) => {
                      const isMe = msg.senderId === currentPlayerId;
                      return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[8px] font-display text-slate-500 uppercase tracking-wider mb-0.5">{msg.senderName}</span>
                          <span className={`px-3 py-2 border-2 border-[#111111] shadow-[2px_2px_0px_#111111] max-w-[85%] leading-relaxed ${
                            isMe ? 'bg-[#FF5A1F] text-white' : 'bg-white text-[#111111]'
                          }`}>
                            {msg.text}
                          </span>
                        </div>
                      );
                    })}
                  
                  {gameState.messages.filter(m => m.isMafiaOnly).length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-center p-4 uppercase tracking-wide text-[10px]">
                      No secret chat yet. Whisper who to eliminate!
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChatSubmit} className="mt-3 flex gap-2 shrink-0 pt-3 border-t-2 border-[#111111]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value.substring(0, 80))}
                    placeholder="Whisper code..."
                    className="flex-grow bg-white border-2 border-[#111111] px-3 py-2 text-xs font-bold text-[#111111] focus:outline-none focus:bg-[#fffdf2]"
                  />
                  <button type="submit" className="bg-[#1FDEFF] text-[#111111] border-2 border-[#111111] p-2 hover:bg-[#00D0FF] shadow-[2px_2px_0px_#111111] cursor-pointer">
                    <Send className="w-4 h-4 stroke-[3]" />
                  </button>
                </form>
              </div>
            ) : (
              /* Non-Mafia: Sleeping Information Sidebar */
              <div className="bg-white border-3 border-[#111111] p-5 flex flex-col shadow-[5px_5px_0px_#1FDEFF] relative overflow-hidden text-[#111111]">
                <p className="font-display text-[9px] text-[#FF5A1F] uppercase tracking-widest mb-1">Your Identity</p>
                <h4 className="text-lg font-display uppercase text-[#111111]">{ROLE_DETAILS[me.role]?.name}</h4>
                
                <div className="mt-5 text-center bg-[#fffdf2] py-6 px-4 border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
                  <div className={`w-14 h-14 border-2 border-[#111111] bg-gradient-to-br ${ROLE_DETAILS[me.role]?.imageColor || 'from-slate-700 to-slate-800'} text-white flex items-center justify-center font-display text-2xl mx-auto shadow-[2px_2px_0px_#111111]`}>
                    {ROLE_DETAILS[me.role]?.name.charAt(0)}
                  </div>
                  <h5 className="text-sm font-display uppercase tracking-wider text-[#111111] mt-4">{ROLE_DETAILS[me.role]?.name}</h5>
                  <p className="text-[9px] font-display uppercase text-slate-500 tracking-wider mt-1">TEAM: {ROLE_DETAILS[me.role]?.team}</p>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mt-4 bg-[#fffdf2]/40 p-3 border border-[#111111] font-bold">
                  {ROLE_DETAILS[me.role]?.description}
                </p>

                {/* If there's an inspection result reported directly in public list */}
                {gameState.messages.find(m => m.senderId === 'system_detective') && me.role === 'detective' && (
                  <div className="mt-5 bg-[#1FDEFF]/15 border-2 border-[#111111] p-4 text-xs font-bold shadow-[2px_2px_0px_#111111]">
                    <p className="font-display text-[10px] text-[#FF5A1F] flex items-center gap-1 uppercase tracking-wide mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Recent Inspection
                    </p>
                    <p className="text-[#111111] leading-relaxed">
                      {gameState.messages.filter(m => m.senderId === 'system_detective').slice(-1)[0]?.text}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
