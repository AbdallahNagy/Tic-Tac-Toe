import { Component } from '@angular/core';
import { StaticBoard } from '../../shared/components/static-board/static-board';

@Component({
  selector: 'app-lobby',
  imports: [StaticBoard],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby {}
