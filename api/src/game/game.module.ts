import { Module } from '@nestjs/common';
import { GameRoomService } from './game-room.service';
import { GameGateway } from './game.gateway';

@Module({
  providers: [GameRoomService, GameGateway],
  exports: [GameRoomService],
})
export class GameModule {}
