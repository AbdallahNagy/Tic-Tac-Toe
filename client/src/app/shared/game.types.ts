export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export interface RoomCreated {
  code: string;
  you: Player;
}

export interface RoomJoined {
  code: string;
  you: Player;
}

export interface GameStart {
  code: string;
}

export interface GameState {
  type: 'state';
  board: Board;
  currentPlayer: Player;
}

export interface GameOver {
  type: 'over';
  board: Board;
  winner: Player | 'draw';
  winningLine?: [number, number, number];
}

export interface OpponentLeft {
  code: string;
}

export interface SocketError {
  message: string;
}

export type AckResult<T> = ({ ok: true } & T) | { ok: false; message: string };
