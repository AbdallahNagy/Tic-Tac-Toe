import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { Board, Player, Room } from './game.types';

@Injectable()
export class GameRoomService {
  private readonly nanoid = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    6,
  );
  private readonly rooms = new Map<string, Room>();
  private readonly socketToCode = new Map<string, string>();

  createRoom(playerSocketId: string): { code: string; you: Player } {
    if (this.socketToCode.has(playerSocketId))
      throw new Error('socket already in a room');

    let code: string;
    do {
      code = this.nanoid();
    } while (this.rooms.has(code));

    const room: Room = {
      code,
      players: { X: playerSocketId },
      board: Array(9).fill(null) as Board,
      currentPlayer: 'X',
      startingPlayer: 'X',
      status: 'waiting',
      rematch: { X: false, O: false },
    };

    this.rooms.set(code, room);
    this.socketToCode.set(playerSocketId, code);

    return { code, you: 'X' };
  }

  joinRoom(code: string, playerSocketId: string): { you: Player } {
    if (this.socketToCode.has(playerSocketId))
      throw new Error('socket already in a room');

    const room = this.rooms.get(code);

    if (!room) throw new Error('no room found with this code!');
    if (room.players.O) throw new Error('room is full!');

    room.players.O = playerSocketId;
    room.status = 'playing';

    this.socketToCode.set(playerSocketId, code);

    return { you: 'O' };
  }

  applyMove(
    code: string,
    playerSocketId: string,
    index: number,
  ):
    | { type: 'state'; board: Board; currentPlayer: Player }
    | {
        type: 'over';
        board: Board;
        winner: Player | 'draw';
        winningLine?: [number, number, number];
      } {
    if (!Number.isInteger(index) || index < 0 || index > 8)
      throw new Error('invalid cell index');

    const room = this.rooms.get(code);

    if (!room) throw new Error('no room found with this code!');

    if (room.status !== 'playing')
      throw new Error('game is not in playing status!');

    if (room.board[index]) throw new Error('square already taken!');

    if (room.players[room.currentPlayer] !== playerSocketId)
      throw new Error('not your turn!');

    room.board[index] = room.currentPlayer;
    room.currentPlayer = room.currentPlayer === 'X' ? 'O' : 'X';

    const winResult = this.checkWin(room.board);

    if (winResult) {
      room.status = 'over';
      return {
        type: 'over',
        board: room.board,
        winner: winResult.winner,
        winningLine: winResult.line,
      };
    }

    if (this.isDraw(room.board)) {
      room.status = 'over';
      return { type: 'over', board: room.board, winner: 'draw' };
    }

    return {
      type: 'state',
      board: room.board,
      currentPlayer: room.currentPlayer,
    };
  }

  requestRematch(code: string, playerSocketId: string) {
    throw new Error('not implemneted yet!');
  }

  removeBySocket(socketId: string) {
    const code = this.socketToCode.get(socketId);

    if (!code) return;

    const room = this.rooms.get(code);

    if (room) {
      if (room.players.X) this.socketToCode.delete(room.players.X);
      if (room.players.O) this.socketToCode.delete(room.players.O);

      this.rooms.delete(code);
    }
  }

  private checkWin(
    board: Board,
  ): { winner: Player; line: [number, number, number] } | null {
    const lines: [number, number, number][] = [
      // rows
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // cols
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      // diagonals
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c])
        return { winner: board[a], line: [a, b, c] };
    }

    return null;
  }

  private isDraw(board: Board): boolean {
    return board.every((cell) => cell !== null);
  }
}
