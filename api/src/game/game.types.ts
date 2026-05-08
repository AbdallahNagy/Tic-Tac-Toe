export interface Room {
  code: string;
  players: {
    X?: string;
    O?: string;
  };
  board: Board;
  currentPlayer: Player;
  startingPlayer: Player;
  status: RoomStatus;
  rematch: {
    X: boolean;
    O: boolean;
  };
}

export type Cell = Player | null;

export type Board = Cell[];

export type Player = 'X' | 'O';

export type RoomStatus = 'waiting' | 'playing' | 'over';
