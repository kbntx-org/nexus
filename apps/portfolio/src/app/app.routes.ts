import { Route } from '@angular/router';

import { CodeViewerComponent } from './pages/code-viewer/code-viewer.component';
import { codeSourceGuard } from './pages/code-viewer/guards/code-source.guard';
import { CvComponent } from './pages/cv/cv.component';
import { ExperiencesComponent } from './pages/experiences/experiences.component';
import { HomeComponent } from './pages/home/home.component';
import { ProjectsComponent } from './pages/projects/projects.component';

export const ROUTES: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'experiences',
    component: ExperiencesComponent
  },
  {
    path: 'projects',
    component: ProjectsComponent
  },
  {
    path: 'cv',
    component: CvComponent
  },
  {
    path: 'code-source/:id',
    component: CodeViewerComponent,
    canActivate: [codeSourceGuard]
  }
];
