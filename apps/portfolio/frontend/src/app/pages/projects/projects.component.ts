import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  ProjectModalComponent,
  Project
} from '../../shared/components/project-modal/project-modal.component';
import { PROJECTS } from './data/projects.data';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ProjectModalComponent],
  templateUrl: './projects.component.html'
})
export class ProjectsComponent {
  public projects = PROJECTS;

  public showModal = false;
  public selectedProject: Project | null = null;

  public openProjectModal(project: Project): void {
    this.selectedProject = project;
    this.showModal = true;
  }

  public closeProjectModal(): void {
    this.showModal = false;
    this.selectedProject = null;
  }
}
