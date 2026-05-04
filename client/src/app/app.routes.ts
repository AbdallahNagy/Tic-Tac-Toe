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
        path: 'board',
        loadComponent: () => import('./features/board/board').then(m => m.Board)
    }
];
