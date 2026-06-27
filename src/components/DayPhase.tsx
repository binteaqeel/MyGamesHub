import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { Timer, MessageSquare, Send, CheckCircle, Info, Skull, Vote, SkipForward } from "lucide-react";
import { GameState } from "../types";

interface DayPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onSendChat: (text: string, isMafiaOnly: boolean) => void;
  onGameAction: (actionType: string, targetId: string | null) => void;
}

export default function DayPhase({
  gameState,
  currentPlayerId,
  onSendChat,
  onGameAction
}: DayPhaseProps) {
  const [chatInput, setChatInput] = useState('');

  const me = gameState.players.find(p => p.id === currentPlayerId);
  if (!me) return null;

  const isDiscussion = gameState.status === 'discussion';
  const isVoting = gameState.status === 'voting';

  const handleSendChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim(), false); // Public chat
    setChatInput('');
  };

  const handleVoteClick = (targetId: string | null) => {
    onGameAction('vote_player', targetId);
  };

  const handleSkipDiscussion = () => {
    onGameAction('skip_discussion', null);
  };

  const alivePlayers = gameState.players.filter(p => p.isAlive);

  return (
    <div id="day-phase-root" className="min-h-screen bg-[#FAFAF8] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Day Header Status Bar */}
        <div className="bg-white border-3 border-[#111111] p-6 shadow-[5px_5px_0px_#111111] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-2 border-[#111111] bg-[#1FDEFF] flex items-center justify-center text-[#111111] shadow-[2px_2px_0px_#111111]">
              <Timer className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <span className="font-display text-xs text-[#FF5A1F] tracking-wider uppercase">
                {isDiscussion ? 'Discussion Phase' : 'Voting Phase'} — DAY 0{gameState.dayCount}
              </span>
              <h2 className="text-2xl font-display text-[#111111] uppercase tracking-tight mt-0.5">
                {isDiscussion ? 'Deduce & Accuse!' : 'Cast your ballots!'}
              </h2>
            </div>
          </div>

          {/* Big Timer */}
          <div className="flex items-center gap-3 bg-[#FF5A1F] text-white px-5 py-3 border-3 border-[#111111] shadow-[3px_3px_0px_#111111]">
            <Timer className="w-5 h-5 stroke-[3] text-white" />
            <div className="font-display text-xl tracking-wider min-w-[50px] text-center uppercase">
              {gameState.timerValue}s
            </div>
          </div>
        </div>

        {/* Morning News Announcement Block */}
        {gameState.eliminatedLastNight.length > 0 ? (
          <div className="bg-red-50 border-3 border-[#111111] p-5 shadow-[4px_4px_0px_#FF5A1F] flex items-start gap-4">
            <div className="p-3 bg-[#FF5A1F] border-2 border-[#111111] text-white shrink-0 shadow-[2px_2px_0px_#111111]">
              <Skull className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-display text-sm text-[#111111] uppercase tracking-wider">Grim Reports</h4>
              <p className="text-[#111111] text-sm mt-1 leading-relaxed font-bold">
                As the morning light rose over the village, the body of <span className="text-[#FF5A1F] font-black">{gameState.eliminatedLastNight.join(', ')}</span> was found. The remaining players gather to find the culprits.
              </p>
            </div>
          </div>
        ) : (
          gameState.dayCount > 1 && (
            <div className="bg-emerald-50 border-3 border-[#111111] p-5 shadow-[4px_4px_0px_#1FDEFF] flex items-start gap-4">
              <div className="p-3 bg-emerald-400 border-2 border-[#111111] text-[#111111] shrink-0 shadow-[2px_2px_0px_#111111]">
                <CheckCircle className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="font-display text-sm text-[#111111] uppercase tracking-wider">A Peaceful Night</h4>
                <p className="text-[#111111] text-sm mt-1 leading-relaxed font-bold">
                  Miraculously, nobody died last night! The Doctor protected well, or the assassins faltered. Use this turn to execute suspects!
                </p>
              </div>
            </div>
          )
        )}

        {/* Day Layout Grid Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Phase Panel (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {isDiscussion ? (
              <div className="bg-white border-3 border-[#111111] p-6 shadow-[5px_5px_0px_#1FDEFF]">
                <div className="flex items-center justify-between mb-4 border-b-2 border-[#111111] pb-3">
                  <h3 className="font-display text-sm text-[#111111] tracking-wider uppercase flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-700" />
                    Town Discussion Board
                  </h3>
                </div>

                <p className="text-xs text-slate-500 font-bold mb-6 uppercase tracking-wide">
                  Discuss with everyone who you think is Mafia.
                </p>

                {/* Living Players Roster Grid */}
                <div>
                  <h4 className="font-display text-xs text-slate-500 mb-4 tracking-wider uppercase">
                    LIVING MEMBERS ROSTER
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {alivePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="p-4 bg-[#fffdf2] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex flex-col items-center justify-center text-center relative overflow-hidden"
                      >
                        {player.id === me.id && (
                          <span className="absolute top-2 right-2 font-display text-[8px] bg-[#FF5A1F] text-white px-1.5 py-0.5 border border-[#111111] uppercase shadow-[1px_1px_0px_#111111]">
                            YOU
                          </span>
                        )}
                        <div className="w-10 h-10 border-2 border-[#111111] bg-white text-[#111111] font-display flex items-center justify-center text-sm mb-2 shrink-0 shadow-[1px_1px_0px_#111111]">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-black text-[#111111] truncate max-w-full">
                          {player.name}
                        </p>
                        <span className="text-[9px] font-display text-slate-500 mt-1 uppercase">Living</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Voting Phase subview */
              <div className="bg-white border-3 border-[#111111] p-6 shadow-[5px_5px_0px_#FF5A1F]">
                <div className="flex items-center justify-between mb-4 border-b-2 border-[#111111] pb-3">
                  <h3 className="font-display text-sm text-[#111111] tracking-wider uppercase flex items-center gap-2">
                    <Vote className="w-5 h-5 text-slate-700" />
                    Cast Your Ballot
                  </h3>
                </div>

                {me.hasVoted ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] bg-[#fffdf2] border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
                    <div className="w-16 h-16 border-2 border-[#111111] bg-[#1FDEFF]/25 text-[#111111] flex items-center justify-center mb-4 shadow-[2px_2px_0px_#111111]">
                      <CheckCircle className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h4 className="text-xl font-display text-[#111111] uppercase">VOTE CAST</h4>
                    <p className="text-slate-700 text-xs mt-2 max-w-sm font-bold uppercase tracking-wider">
                      You have submitted your vote! Waiting for all remaining players to finish voting or for the timer to expire...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      Select a suspected player below to execute them, or click the Skip button at the bottom if you want to skip voting today.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {alivePlayers
                        .filter(p => p.id !== me.id)
                        .map((player) => (
                          <motion.div
                            key={player.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleVoteClick(player.id)}
                            className="p-4 bg-white border-2 border-[#111111] hover:bg-orange-50 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-[3px_3px_0px_#111111]"
                            id={`vote-target-${player.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 border-2 border-[#111111] bg-[#fffdf2] text-[#111111] font-display flex items-center justify-center shadow-[1px_1px_0px_#111111]">
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-[#111111]">{player.name}</p>
                                <p className="text-[9px] text-slate-500 font-extrabold uppercase">ACCUSE MEMBER</p>
                              </div>
                            </div>
                            
                            <span className="font-display text-[9px] bg-[#FF5A1F] text-white border border-[#111111] px-2.5 py-1 uppercase tracking-wider shadow-[1px_1px_0px_#111111]">
                              VOTE
                            </span>
                          </motion.div>
                        ))}
                    </div>

                    {/* Skip Voting Button */}
                    <div className="border-t-2 border-[#111111] pt-6">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleVoteClick('skip')}
                        className="w-full bg-[#1FDEFF] hover:bg-[#00D0FF] text-[#111111] border-3 border-[#111111] py-3.5 font-display text-sm tracking-widest uppercase transition-all shadow-[3px_3px_0px_#111111] cursor-pointer"
                        id="vote-target-skip"
                      >
                        Skip Voting Today
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voting Turnout Monitor Bar */}
            <div className="bg-white border-3 border-[#111111] p-5 shadow-[4px_4px_0px_#111111] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#FF5A1F] shrink-0 stroke-[3]" />
                <p className="text-xs text-[#111111] font-bold uppercase tracking-wider">
                  {isVoting 
                    ? "Check who has voted so far:" 
                    : "The players are actively debating in the chat room."}
                </p>
              </div>

              {isVoting && (
                <div className="flex flex-wrap gap-2">
                  {alivePlayers.map(p => (
                    <span
                      key={p.id}
                      className={`text-[9px] font-display px-2.5 py-1 border transition-all shadow-[1px_1px_0px_#111111] ${
                        p.hasVoted
                          ? 'bg-[#1FDEFF]/15 text-[#111111] border-[#111111]'
                          : 'bg-slate-100 text-slate-400 border-slate-300 shadow-none'
                      }`}
                    >
                      {p.name} {p.hasVoted ? '✓' : '...'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel Column (1 col) */}
          <div className="bg-white border-3 border-[#111111] p-5 flex flex-col h-[520px] shadow-[5px_5px_0px_#111111] relative overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-[#111111] shrink-0">
              <span className="w-3 h-3 rounded-none bg-emerald-500 animate-pulse"></span>
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <h4 className="font-display text-xs text-[#111111] tracking-wider uppercase">TOWN SQUARE CHAT</h4>
            </div>

            {/* Chat message box log */}
            <div className="flex-grow overflow-y-auto py-3 space-y-3 pr-1 text-xs font-bold">
              {gameState.messages
                .filter(m => !m.isMafiaOnly)
                .map((msg, i) => {
                  const isMe = msg.senderId === currentPlayerId;
                  const isSystem = msg.senderId === 'system' || msg.senderId === 'system_detective';
                  
                  if (isSystem) {
                    return (
                      <div key={i} className="bg-[#fffdf2] border-2 border-[#111111] p-3 text-center text-[#111111] text-[10px] uppercase tracking-wide leading-relaxed shadow-[2px_2px_0px_#111111]">
                        <span className="font-display text-xs block text-[#FF5A1F] mb-0.5">{msg.senderName}</span>
                        {msg.text}
                      </div>
                    );
                  }

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
              
              {gameState.messages.filter(m => !m.isMafiaOnly).length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-center p-4 uppercase tracking-wider text-[9px]">
                  Type below to open the conversation! Share your deductions.
                </div>
              )}
            </div>

            <form onSubmit={handleSendChatSubmit} className="mt-3 flex gap-2 shrink-0 pt-3 border-t-2 border-[#111111]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value.substring(0, 100))}
                placeholder="Accuse suspect..."
                className="flex-grow bg-white border-2 border-[#111111] px-3 py-2 text-xs font-bold text-[#111111] focus:outline-none focus:bg-[#fffdf2]"
              />
              <button type="submit" className="bg-[#FF5A1F] text-white border-2 border-[#111111] p-2 hover:bg-[#e04a15] shadow-[2px_2px_0px_#111111] cursor-pointer">
                <Send className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
