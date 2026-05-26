import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Board } from '../../game.types';

@Component({
  selector: 'app-game-board',
  imports: [],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameBoard {
  readonly board = input.required<Board>();
  readonly winningLine = input<readonly number[] | null>(null);
  readonly disabled = input<boolean>(false);
  readonly cellClick = output<number>();

  readonly indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  isWinning(index: number): boolean {
    return this.winningLine()?.includes(index) ?? false;
  }

  onCell(index: number) {
    if (this.disabled()) return;
    if (this.board()[index]) return;
    this.cellClick.emit(index);
  }
}
