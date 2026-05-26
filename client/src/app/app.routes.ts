import { Routes } from '@angular/router';
import { Lobby } from './features/lobby/lobby';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'lobby',
        pathMatch: 'full'
    },
    {
        path: 'lobby',
        component: Lobby
    },
    {
        path: 'game',
        loadComponent: () => import('./features/game/game').then(m => m.Game)
    }
];
