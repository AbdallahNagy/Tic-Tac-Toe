import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {
  AckResult,
  GameOver,
  GameStart,
  GameState,
  OpponentLeft,
  RoomCreated,
  RoomJoined,
  SocketError,
} from '../game.types';

const SERVER_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  readonly connected = signal(false);
  readonly gameStart = signal<GameStart | null>(null);
  readonly gameState = signal<GameState | null>(null);
  readonly gameOver = signal<GameOver | null>(null);
  readonly opponentLeft = signal<OpponentLeft | null>(null);
  readonly lastError = signal<SocketError | null>(null);

  connect(): Socket {
    if (this.socket) return this.socket;

    this.socket = io(SERVER_URL, { autoConnect: true });

    this.socket.on('connect', () => {
      this.connected.set(true);
      console.log('connected to socket io');
    });
    this.socket.on('disconnect', () => this.connected.set(false));

    this.socket.on('game:start', (payload: GameStart) => this.gameStart.set(payload));
    this.socket.on('game:state', (payload: GameState) => {
      this.gameState.set(payload);
      this.gameOver.set(null);
    });
    this.socket.on('game:over', (payload: GameOver) => this.gameOver.set(payload));
    this.socket.on('opponent:left', (payload: OpponentLeft) => this.opponentLeft.set(payload));
    this.socket.on('error', (payload: SocketError) => this.lastError.set(payload));

    return this.socket;
  }

  createRoom(): Promise<RoomCreated> {
    const socket = this.connect();

    return new Promise((resolve, reject) => {
      socket.emit('room:create', {}, (ack: AckResult<RoomCreated>) => {
        console.log(ack);
        if (ack?.ok) resolve({ code: ack.code, you: ack.you });
        else reject(new Error(ack?.message ?? 'failed to create room'));
      });
    });
  }

  joinRoom(code: string): Promise<RoomJoined> {
    const socket = this.connect();
    return new Promise((resolve, reject) => {
      socket.emit('room:join', { code }, (ack: AckResult<RoomJoined>) => {
        if (ack?.ok) resolve({ code: ack.code, you: ack.you });
        else reject(new Error(ack?.message ?? 'failed to join room'));
      });
    });
  }

  makeMove(index: number): void {
    this.socket?.emit('game:move', { index });
  }

  resetState(): void {
    this.gameStart.set(null);
    this.gameState.set(null);
    this.gameOver.set(null);
    this.opponentLeft.set(null);
    this.lastError.set(null);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
    this.resetState();
  }
}
