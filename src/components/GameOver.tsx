import { motion } from "motion/react";
import { Award, RefreshCw, Trophy, Skull, Users, ShieldAlert, Sparkles } from "lucide-react";
import { GameState, ROLE_DETAILS } from "../types";

interface GameOverProps {
  gameState: GameState;
  onRestart: () => void;
}

export default function GameOver({ gameState, onRestart }: GameOverProps) {
  const winner = gameState.winner; // 'civilians' | 'mafia' | 'serial_killer' | 'jester'
  
  let winnerTitle = "CONGRATULATIONS!";
  let winnerBanner = "CIVILIANS WIN";
  let winnerDesc = "The peaceful civilians worked together, filtered out the criminal faction, and saved the village!";
  let cardBg = "bg-[#1FDEFF]";
  let shadowColor = "#FF5A1F";

  if (winner === 'mafia') {
    winnerBanner = "MAFIA TEAM WINS";
    winnerDesc = "The hidden conspiracy succeeded! The Mafias infiltrated the town completely and eliminated all resistance.";
    cardBg = "bg-[#FF5A1F]";
    shadowColor = "#1FDEFF";
  } else if (winner === 'serial_killer') {
    winnerBanner = `${gameState.winnerName?.toUpperCase() || 'SERIAL KILLER'} WINS`;
    winnerDesc = "Against all odds, the independent Serial Killer eliminated everyone else and stands alone as the victor of the night!";
    cardBg = "bg-fuchsia-400";
    shadowColor = "#111111";
  } else if (winner === 'jester') {
    winnerBanner = `${gameState.winnerName?.toUpperCase() || 'JESTER'} WINS INSTANTLY`;
    winnerDesc = "Outstanding deception! The chaotic Jester successfully behaved suspiciously enough during the day to get executed, winning immediately!";
    cardBg = "bg-amber-400";
    shadowColor = "#111111";
  }

  return (
    <div id="game-over-root" className="min-h-screen bg-[#FAFAF8] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Victory Card Banner */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${cardBg} text-[#111111] border-3 border-[#111111] p-8 text-center shadow-[6px_6px_0px_#111111] relative overflow-hidden`}
        >
          <div className="inline-flex items-center justify-center p-4 bg-white border-2 border-[#111111] mb-4 shadow-[2px_2px_0px_#111111]">
            <Trophy className="w-10 h-10 text-[#111111] animate-bounce" />
          </div>

          <p className="font-display text-xs tracking-wider uppercase text-[#111111]/85">{winnerTitle}</p>
          <h1 className="text-4xl sm:text-5xl font-display uppercase tracking-tight mt-1">{winnerBanner}</h1>
          <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-[#111111] leading-relaxed font-bold">
            {winnerDesc}
          </p>
        </motion.div>

        {/* scoreboard section */}
        <div className="bg-white border-3 border-[#111111] p-6 sm:p-8 shadow-[5px_5px_0px_#111111]">
          <h2 className="text-sm font-display text-[#111111] tracking-wider uppercase mb-6 flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#111111] pb-4 gap-2">
            <span>FULL ROUND SCOREBOARD</span>
            <span className="text-xs font-display text-[#111111] bg-[#fffdf2] border-2 border-[#111111] px-3 py-1 flex items-center gap-1.5 shadow-[1px_1px_0px_#111111]">
              <Users className="w-4 h-4 text-slate-700" /> {gameState.players.length} Competitors
            </span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-bold">
              <thead>
                <tr className="border-b-2 border-[#111111] pb-3 text-slate-500 font-display text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">Player</th>
                  <th className="pb-3 pr-4">Secret Identity</th>
                  <th className="pb-3 pr-4">Faction</th>
                  <th className="pb-3 text-right">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {gameState.players.map((player, idx) => {
                  const roleData = ROLE_DETAILS[player.role] || ROLE_DETAILS.civilian;
                  
                  return (
                    <tr key={player.id} className="hover:bg-slate-50 transition-all">
                      <td className="py-4 pr-4 flex items-center gap-3">
                        <div className="w-9 h-9 border-2 border-[#111111] bg-[#1FDEFF]/15 text-[#111111] font-display flex items-center justify-center text-xs shrink-0 shadow-[1px_1px_0px_#111111]">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-[#111111] block truncate max-w-[150px]">{player.name}</span>
                          <span className="text-[9px] font-display text-slate-400 uppercase tracking-wider">
                            {player.isBot ? "AI BOT" : "HUMAN"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 border border-[#111111] bg-gradient-to-br ${roleData.imageColor} shrink-0 text-[10px] font-display text-white flex items-center justify-center`}>
                            {roleData.name.charAt(0)}
                          </div>
                          <span className="font-bold text-[#111111]">{roleData.name}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`text-[9px] font-display px-2 py-0.5 border border-[#111111] uppercase tracking-wider ${
                          roleData.team === 'Civilian' ? 'bg-[#1FDEFF]/15 text-[#111111]' : roleData.team === 'Mafia' ? 'bg-[#FF5A1F]/15 text-[#111111]' : 'bg-fuchsia-50 text-fuchsia-700'
                        }`}>
                          {roleData.team}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {player.isAlive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-display text-emerald-700 bg-emerald-50 border-2 border-emerald-500 px-2.5 py-1 shadow-[1px_1px_0px_#111111]">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> SURVIVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-display text-slate-500 bg-slate-50 border-2 border-slate-400 px-2.5 py-1">
                            <Skull className="w-3.5 h-3.5" /> ELIMINATED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 border-t-2 border-[#111111] pt-6 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="px-8 py-4 bg-[#FF5A1F] hover:bg-[#e04a15] text-white border-3 border-[#111111] font-display text-sm tracking-widest uppercase flex items-center gap-2 shadow-[4px_4px_0px_#111111] transition-all cursor-pointer"
              id="exit-game-over-btn"
            >
              <RefreshCw className="w-4 h-4 stroke-[3]" />
              Exit to GameHub Home
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
}
