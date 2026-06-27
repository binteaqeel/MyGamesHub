export interface Player {
  id: string;
  name: string;
  role: string; // Will only be visible to client if it's their own, or they are both Mafias, or game is over
  isAlive: boolean;
  isHost: boolean;
  isBot: boolean;
  hasVoted: boolean;
  hasDoneMiniGame: boolean;
}

export interface Message {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isMafiaOnly: boolean;
}

export interface GameState {
  code: string;
  creatorId: string;
  maxPlayers: number;
  discussionTime: number;
  votingTime: number;
  selectedRoles: string[];
  status: 'waiting' | 'night_mafia' | 'night_doctor' | 'night_detective' | 'night_vigilante' | 'night_serial_killer' | 'morning' | 'discussion' | 'voting' | 'game_over';
  players: Player[];
  messages: Message[];
  winner: string | null; // 'civilians' | 'mafia' | 'serial_killer' | 'jester'
  winnerName?: string;
  eliminatedLastNight: string[];
  eliminatedLastDay: string | null;
  dayCount: number;
  timerValue: number;
  tieOccurred: boolean;
  votingSkipped: boolean;
  currentPlayerRole: string;
  currentPlayerIsAlive: boolean;
  currentPlayerSelfHealUsed: boolean;
}

export interface RoleDetail {
  id: string;
  name: string;
  team: 'Civilian' | 'Mafia' | 'Solo';
  description: string;
  ability: string;
  imageColor: string;
}

export const ROLE_DETAILS: Record<string, RoleDetail> = {
  doctor: {
    id: 'doctor',
    name: 'The Doctor',
    team: 'Civilian',
    description: 'The ultimate protector of the town.',
    ability: 'Each Night, choose one player to protect from elimination. You can protect yourself, but only once per game.',
    imageColor: 'from-emerald-400 to-teal-500'
  },
  detective: {
    id: 'detective',
    name: 'The Detective',
    team: 'Civilian',
    description: 'The key investigator and civilian informant.',
    ability: 'Each Night, choose one player to investigate. The Moderator reveals if they are Mafia or Innocent.',
    imageColor: 'from-sky-400 to-blue-500'
  },
  vigilante: {
    id: 'vigilante',
    name: 'The Vigilante',
    team: 'Civilian',
    description: 'A civilian taking justice into their own hands.',
    ability: 'Each Night, you can choose to eliminate one suspected player. A bad guess will accidentally eliminate an innocent ally.',
    imageColor: 'from-amber-400 to-orange-500'
  },
  serial_killer: {
    id: 'serial_killer',
    name: 'The Serial Killer',
    team: 'Solo',
    description: 'An independent force of chaos.',
    ability: 'You act alone and win only if everyone else is dead. Wake up each Night to eliminate one player.',
    imageColor: 'from-rose-500 to-red-600'
  },
  jester: {
    id: 'jester',
    name: 'The Jester',
    team: 'Solo',
    description: 'A master of deception and reverse psychology.',
    ability: 'Your sole objective is to behave suspiciously enough during the Day to get voted off. If executed, you win instantly.',
    imageColor: 'from-pink-400 to-purple-500'
  },
  godmother: {
    id: 'godmother',
    name: 'The Godmother',
    team: 'Mafia',
    description: 'The elusive matriarch of the Mafia syndicates.',
    ability: 'You register as an "innocent civilian" to the Detective, providing the perfect shield against detection.',
    imageColor: 'from-slate-600 to-slate-800'
  },
  mafia: {
    id: 'mafia',
    name: 'Mafia Member',
    team: 'Mafia',
    description: 'A member of the secret criminal faction.',
    ability: 'Coordinate with other Mafias each Night to choose an innocent player to eliminate.',
    imageColor: 'from-red-400 to-rose-500'
  },
  civilian: {
    id: 'civilian',
    name: 'Innocent Civilian',
    team: 'Civilian',
    description: 'A peaceful member of the village.',
    ability: 'Work together during the Day to discuss, deduce, and vote out the hidden threats.',
    imageColor: 'from-gray-300 to-gray-400'
  }
};
