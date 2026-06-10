import { GameRoomService } from './game-room.service';

describe('GameRoomService — rematch', () => {
  let service: GameRoomService;
  const X = 'socket-x';
  const O = 'socket-o';

  /** Creates a room, joins a second player, and plays X to a top-row win. */
  function setupFinishedGame(): string {
    const { code } = service.createRoom(X);
    service.joinRoom(code, O);
    service.applyMove(code, X, 0); // X
    service.applyMove(code, O, 3); // O
    service.applyMove(code, X, 1); // X
    service.applyMove(code, O, 4); // O
    service.applyMove(code, X, 2); // X wins [0,1,2]
    return code;
  }

  beforeEach(() => {
    service = new GameRoomService();
  });

  it('returns pending when only one player has opted in', () => {
    const code = setupFinishedGame();

    const result = service.requestRematch(code, X);

    expect(result).toEqual({ type: 'pending', rematch: { X: true, O: false } });
  });

  it('keeps the finished board and status until both opt in', () => {
    const code = setupFinishedGame();

    service.requestRematch(code, X);

    // A second move attempt must still fail because the game is not playing.
    expect(() => service.applyMove(code, O, 5)).toThrow(
      'game is not in playing status!',
    );
  });

  it('restarts with a clean board when both players opt in', () => {
    const code = setupFinishedGame();

    service.requestRematch(code, X);
    const result = service.requestRematch(code, O);

    expect(result).toEqual({
      type: 'restart',
      board: Array(9).fill(null),
      currentPlayer: 'X',
    });
  });

  it('allows play again after a restart', () => {
    const code = setupFinishedGame();
    service.requestRematch(code, X);
    service.requestRematch(code, O);

    // X moves first in the fresh game.
    expect(() => service.applyMove(code, X, 0)).not.toThrow();
  });

  it('resets the rematch flags after a restart', () => {
    const code = setupFinishedGame();
    service.requestRematch(code, X);
    service.requestRematch(code, O); // restart

    // Finish the new game so we can request a rematch again.
    service.applyMove(code, X, 0);
    service.applyMove(code, O, 3);
    service.applyMove(code, X, 1);
    service.applyMove(code, O, 4);
    service.applyMove(code, X, 2); // X wins again

    // A single opt-in should be pending again, proving flags were reset.
    const result = service.requestRematch(code, X);
    expect(result).toEqual({ type: 'pending', rematch: { X: true, O: false } });
  });

  it('throws when the game is not over', () => {
    const { code } = service.createRoom(X);
    service.joinRoom(code, O);

    expect(() => service.requestRematch(code, X)).toThrow(
      'game is not over!',
    );
  });

  it('throws when the room does not exist', () => {
    expect(() => service.requestRematch('NOPE12', X)).toThrow(
      'room not found!',
    );
  });
});
