import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ProjectModalComponent,
} from './components/project-modal/project-modal.component';
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

  public getCardVariation(index: number): string {
    const variations = [
      'hover:border-blue-500/50',
      'hover:border-green-500/50',
      'hover:border-purple-500/50',
      'hover:border-orange-500/50',
      'hover:border-pink-500/50',
      'hover:border-cyan-500/50'
    ];
    return variations[index % variations.length];
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

  public getTechTagColor(index: number): string {
    const colors = [
      'bg-blue-200 text-blue-800',
      'bg-green-200 text-green-800',
      'bg-purple-200 text-purple-800',
      'bg-orange-200 text-orange-800',
      'bg-pink-200 text-pink-800',
      'bg-cyan-200 text-cyan-800',
      'bg-red-200 text-red-800',
      'bg-indigo-200 text-indigo-800',
      'bg-yellow-200 text-yellow-800',
      'bg-teal-200 text-teal-800'
    ];
    return colors[index % colors.length];
  }
}
