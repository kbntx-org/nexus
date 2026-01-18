import { Route } from '@angular/router';

import { codeSourceGuard } from './pages/code-viewer/guards/code-source.guard';

export const ROUTES: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'experiences',
    loadComponent: () => import('./pages/experiences/experiences.component').then(m => m.ExperiencesComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'code-source/:id',
    loadComponent: () => import('./pages/code-viewer/code-viewer.component').then(m => m.CodeViewerComponent),
    canActivate: [codeSourceGuard]
  }
];
