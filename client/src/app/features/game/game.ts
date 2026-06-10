import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameBoard } from '../../shared/components/game-board/game-board';
import { Board, Player } from '../../shared/game.types';
import { SocketService } from '../../shared/services/socket.service';

type Screen = 'menu' | 'create' | 'join' | 'playing';

@Component({
  selector: 'app-game',
  imports: [FormsModule, RouterLink, GameBoard],
  templateUrl: './game.html',
  styleUrl: './game.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Game implements OnDestroy {
  private readonly socket = inject(SocketService);

  constructor() {
    effect(() => {
      if (this.socket.gameStart() && this.screen() === 'create') {
        this.waitingForOpponent.set(false);
        this.screen.set('playing');
      }
    });
  }

  readonly screen = signal<Screen>('menu');
  readonly code = signal<string>('');
  readonly you = signal<Player | null>(null);
  readonly joinInput = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly waitingForOpponent = signal<boolean>(false);

  readonly board = computed<Board>(() => {
    const over = this.socket.gameOver();
    if (over) return over.board;
    const state = this.socket.gameState();
    if (state) return state.board;
    return Array<null>(9).fill(null);
  });

  readonly currentPlayer = computed<Player | null>(() => {
    const over = this.socket.gameOver();
    if (over) return null;
    return this.socket.gameState()?.currentPlayer ?? 'X';
  });

  readonly isMyTurn = computed<boolean>(() => {
    const cp = this.currentPlayer();
    return cp !== null && cp === this.you();
  });

  readonly winningLine = computed<readonly number[] | null>(
    () => this.socket.gameOver()?.winningLine ?? null,
  );

  readonly resultBanner = computed<string | null>(() => {
    const over = this.socket.gameOver();
    if (!over) return null;
    if (over.winner === 'draw') return "It's a draw";
    return over.winner === this.you() ? 'You win!' : 'You lose';
  });

  readonly opponentLeftBanner = computed<string | null>(() =>
    this.socket.opponentLeft() ? 'Your opponent left the room' : null,
  );

  readonly iRequestedRematch = computed<boolean>(() => {
    const me = this.you();
    return !!me && !!this.socket.rematchState()?.[me];
  });

  readonly rematchStatus = computed<string | null>(() => {
    const state = this.socket.rematchState();
    const me = this.you();
    if (!state || !me) return null;
    const opponent = me === 'X' ? 'O' : 'X';
    if (state[me]) return 'Waiting for opponent to accept…';
    if (state[opponent]) return 'Opponent wants a rematch!';
    return null;
  });

  readonly turnLabel = computed<string>(() => {
    if (this.waitingForOpponent()) return 'Waiting for opponent…';
    if (this.resultBanner()) return this.resultBanner()!;
    return this.isMyTurn() ? 'Your turn' : "Opponent's turn";
  });

  async onCreate() {
    this.errorMessage.set(null);
    try {
      const { code, you } = await this.socket.createRoom();
      this.code.set(code);
      this.you.set(you);
      this.waitingForOpponent.set(true);
      this.screen.set('create');
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'failed to create room');
    }
  }

  async onJoin() {
    this.errorMessage.set(null);
    const code = this.joinInput().trim().toUpperCase();
    if (!code) {
      this.errorMessage.set('enter a room code');
      return;
    }
    try {
      const result = await this.socket.joinRoom(code);
      this.code.set(result.code);
      this.you.set(result.you);
      this.screen.set('playing');
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'failed to join room');
    }
  }

  onCellClick(index: number) {
    if (!this.isMyTurn()) return;
    if (this.socket.gameOver()) return;
    this.socket.makeMove(index);
  }

  onRematch() {
    const code = this.code();
    if (code) this.socket.requestRematch(code);
  }

  goJoin() {
    this.screen.set('join');
    this.errorMessage.set(null);
  }

  goMenu() {
    this.screen.set('menu');
    this.errorMessage.set(null);
    this.joinInput.set('');
  }

  copyCode() {
    const code = this.code();
    if (code && navigator.clipboard) {
      void navigator.clipboard.writeText(code);
    }
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
