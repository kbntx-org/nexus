import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ProjectModalComponent } from './components/project-modal/project-modal.component';
import { Project, ProjectsService } from './services/projects.service';

@Component({
  selector: 'app-projects',
  imports: [CommonModule, ProjectModalComponent],
  providers: [ProjectsService],
  templateUrl: './projects.component.html'
})
export class ProjectsComponent {
  public projectsService = inject(ProjectsService);

  public selectedProject: Project | null = null;

  public openProjectModal(project: Project): void {
    this.selectedProject = project;
  }

  public closeProjectModal(): void {
    this.selectedProject = null;
  }

  public openSourceCode(githubUrl: string): void {
    window.open(githubUrl, '_blank');
  }

  public getLogoGradient(index: number): string {
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-purple-500 to-pink-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600'
    ];
    return gradients[index % gradients.length];
  }
}
