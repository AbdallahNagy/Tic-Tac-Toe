import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoomService } from './game-room.service';
import { joinRoomSchema, moveSchema } from './dto/game.dto';

@WebSocketGateway({
  cors: {
    origin: String(process.env.CLIENT_URL).split(','),
    credentials: true,
  },
})
export class GameGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameRoomService: GameRoomService) {}

  @SubscribeMessage('room:create')
  handleCreateRoom(@ConnectedSocket() socket: Socket) {
    try {
      const { code, you } = this.gameRoomService.createRoom(socket.id);
      void socket.join(code);
      return { ok: true as const, code, you };
    } catch (err) {
      return this.emitError(socket, err);
    }
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ) {
    const parsed = joinRoomSchema.safeParse(payload);
    if (!parsed.success) return this.emitError(socket, 'invalid payload');

    try {
      const { code } = parsed.data;
      const { you } = this.gameRoomService.joinRoom(code, socket.id);
      void socket.join(code);

      this.server.to(code).emit('game:start', { code });
      return { ok: true as const, code, you };
    } catch (err) {
      return this.emitError(socket, err);
    }
  }

  @SubscribeMessage('game:move')
  handleMove(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ) {
    const parsed = moveSchema.safeParse(payload);
    if (!parsed.success) return this.emitError(socket, 'invalid payload');

    const code = this.gameRoomService.getCodeBySocket(socket.id);
    if (!code) return this.emitError(socket, 'not in a room');

    try {
      const result = this.gameRoomService.applyMove(
        code,
        socket.id,
        parsed.data.index,
      );

      if (result.type === 'over') {
        this.server.to(code).emit('game:over', result);
      } else {
        this.server.to(code).emit('game:state', result);
      }
    } catch (err) {
      return this.emitError(socket, err);
    }
  }

  @SubscribeMessage('game:rematch')
  handleRematch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ) {
    const parsed = joinRoomSchema.safeParse(payload);
    if (!parsed.success) return this.emitError(socket, 'invalid payload');

    const { code } = parsed.data;

    try {
      const result = this.gameRoomService.requestRematch(code, socket.id);

      if (result.type === 'restart') {
        this.server.to(code).emit('game:restart', {
          board: result.board,
          currentPlayer: result.currentPlayer,
        });
      } else {
        this.server.to(code).emit('game:rematch:update', result.rematch);
      }
    } catch (err) {
      return this.emitError(socket, err);
    }
  }

  handleDisconnect(socket: Socket) {
    const result = this.gameRoomService.removeBySocket(socket.id);
    if (!result) return;

    const { code, opponentSocketId } = result;
    if (opponentSocketId) {
      this.server.to(opponentSocketId).emit('opponent:left', { code });
    }
  }

  private emitError(socket: Socket, err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'unknown error';
    this.logger.warn(`socket=${socket.id} error=${message}`);
    socket.emit('error', { message });
    return { ok: false as const, message };
  }
}
