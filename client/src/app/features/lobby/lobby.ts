import { Component } from '@angular/core';
import { ThemeControllerSunMoon } from '../../shared/components/theme-controller-sun-moon/theme-controller-sun-moon';
import { StaticBoard } from "../../shared/components/static-board/static-board";

@Component({
  selector: 'app-lobby',
  imports: [
    ThemeControllerSunMoon,
    StaticBoard
],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby {}
