# Rematch (mutual consent) — Design

**Date:** 2026-06-10
**Status:** Approved

## Goal

Let two players in a finished game start a fresh game without leaving the room.
The rematch uses **mutual consent**: both players must opt in before a new game
begins. No scoreboard is tracked — each rematch is a clean board. X always moves
first.

## Current state

- `Room` already carries `rematch: { X: boolean; O: boolean }` and an (unused)
  `startingPlayer` field.
- `requestRematch()` is half-written: it sets the requesting player's flag but
  also flips `status` to `'waiting'` on a single click and emits nothing — this
  is incorrect and is replaced by this design.
- The gateway's `game:rematch` handler records the request but broadcasts no
  event.
- The frontend has no rematch UI, no `requestRematch` method, and no listeners.

## Protocol / events

| Direction        | Event                  | Payload                      | Meaning                                   |
| ---------------- | ---------------------- | ---------------------------- | ----------------------------------------- |
| client → server  | `game:rematch`         | `{ code }` *(exists)*        | "I want a rematch" — sets my flag         |
| server → both    | `game:rematch:update`  | `{ X: boolean, O: boolean }` | One player opted in; broadcast who's in   |
| server → both    | `game:restart`         | `{ board, currentPlayer }`   | Both opted in — fresh game starting       |

**Flow:**

1. X clicks Rematch → server sets `rematch.X = true` → broadcasts
   `game:rematch:update { X: true, O: false }`.
   - X's UI shows "waiting for opponent…"
   - O's UI shows "opponent wants a rematch."
2. O clicks Rematch → both flags true → server resets the room and broadcasts
   `game:restart` with an empty board and `currentPlayer: 'X'`.

## Backend logic (`game-room.service.ts`)

Rewrite `requestRematch(code, playerSocketId)`:

- Throw if the room is missing.
- Throw if `status !== 'over'` (cannot rematch a game in progress or one still
  waiting for a second player).
- Set the requesting player's flag (`rematch.X` or `rematch.O`) based on socket.
- **Do not** change `status` on a single request (this removes the existing bug
  where one click flips status to `'waiting'`).
- If **both** flags are now `true`:
  - Clear the board to 9 nulls.
  - `currentPlayer = 'X'`.
  - `status = 'playing'`.
  - Reset `rematch` to `{ X: false, O: false }`.
  - Return a `restart` result: `{ type: 'restart', board, currentPlayer }`.
- Otherwise return a `pending` result: `{ type: 'pending', rematch: { X, O } }`.

The gateway's `handleRematch` emits to the room based on the result:

- `restart` → `this.server.to(code).emit('game:restart', { board, currentPlayer })`
- `pending` → `this.server.to(code).emit('game:rematch:update', result.rematch)`

## Frontend

### Socket service (`socket.service.ts`)

- Add a `rematchState` signal: `signal<{ X: boolean; O: boolean } | null>(null)`.
- Listen for `game:rematch:update` → set `rematchState`.
- Listen for `game:restart` → set `gameState` from the payload, clear `gameOver`,
  clear `rematchState` (board and banners reset automatically).
- Add `requestRematch(code: string): void` that emits `game:rematch` with `{ code }`.
- Add `GameRestart` and rematch-update types to `game.types.ts`.
- Reset `rematchState` in `resetState()`.

### Game component (`game.ts` / `game.html`)

- When `gameOver` is set and the opponent has **not** left, show a **Rematch**
  button.
- After I click Rematch, show "waiting for opponent…" (derived from
  `rematchState` for my own mark).
- When the opponent has opted in (their flag in `rematchState`), surface
  "opponent wants a rematch."
- On `game:restart`, the board and result banner clear automatically; we stay on
  the `playing` screen.

## Edge cases

- **Opponent leaves while a rematch is pending** → the existing `opponent:left`
  flow deletes the room; the Rematch button is hidden once `opponentLeft` is set.
- **Rematch requested before game over** → service throws, gateway emits `error`.
- **Duplicate request from same player** → idempotent; the flag is simply set
  `true` again and an updated `game:rematch:update` is re-broadcast.

## Testing

- Unit-test `requestRematch`:
  - one flag set → `pending` result, board unchanged, status stays `over`.
  - both flags set → `restart` result, board cleared, `currentPlayer === 'X'`,
    status `playing`, flags reset.
  - rejects when `status !== 'over'`.
  - rejects when room not found.
- Gateway / integration: both clients in a room receive `game:restart` after the
  second consent; a single consent broadcasts `game:rematch:update`.

## Out of scope (YAGNI)

- Scoreboard / running win count.
- Alternating or loser-first starting player (X always starts).
- Request/accept (one-sided) flow — replaced by mutual consent.
