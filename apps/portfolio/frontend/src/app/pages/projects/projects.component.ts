import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  ProjectModalComponent,
  Project
} from '../../shared/components/project-modal/project-modal.component';
import { PROJECTS } from './data/projects.data';

@Component({
  selector: 'app-projects',
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

  public openSourceCode(githubUrl: string): void {
    window.open(githubUrl, '_blank');
  }

  public getCardVariation(index: number): string {
    const variations = [
      'hover:border-blue-500/50', // Blue accent
      'hover:border-green-500/50', // Green accent
      'hover:border-purple-500/50', // Purple accent
      'hover:border-orange-500/50', // Orange accent
      'hover:border-pink-500/50', // Pink accent
      'hover:border-cyan-500/50' // Cyan accent
    ];
    return variations[index % variations.length];
  }

  public getLogoGradient(index: number): string {
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-purple-600', // Blue to purple
      'bg-gradient-to-br from-green-500 to-teal-600', // Green to teal
      'bg-gradient-to-br from-purple-500 to-pink-600', // Purple to pink
      'bg-gradient-to-br from-orange-500 to-red-600', // Orange to red
      'bg-gradient-to-br from-pink-500 to-rose-600', // Pink to rose
      'bg-gradient-to-br from-cyan-500 to-blue-600' // Cyan to blue
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
