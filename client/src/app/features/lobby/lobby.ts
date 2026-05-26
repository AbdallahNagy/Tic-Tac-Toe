import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StaticBoard } from '../../shared/components/static-board/static-board';

@Component({
  selector: 'app-lobby',
  imports: [RouterLink, StaticBoard],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby {}
