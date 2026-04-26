import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import fm from 'front-matter';
import { marked } from 'marked';
import { firstValueFrom } from 'rxjs';

const PROJECT_FILES = [
  'assets/content/projects/nexus-observability.md',
  'assets/content/projects/nexus-kubernetes.md',
  'assets/content/projects/portfolio.md'
];

export interface Project {
  title: string;
  description: string;
  tech: string[];
  features: string[];
  content: string;
  liveUrl?: string;
  githubUrl?: string;
  images?: string[];
  logo?: string;
}

type ProjectMetadata = Omit<Project, 'content'>;

@Injectable()
export class ProjectsService {
  private readonly httpClient = inject(HttpClient);

  private readonly projectsSignal = signal<Project[]>([]);
  public readonly projects = this.projectsSignal.asReadonly();

  constructor() {
    this.loadProjectFiles();
  }

  private async loadProjectFiles(): Promise<void> {
    const rawFiles = await Promise.all(
      PROJECT_FILES.map(file => firstValueFrom(this.httpClient.get(file, { responseType: 'text' })))
    );

    const projects = rawFiles
      .map(raw => fm<ProjectMetadata>(raw))
      .map(parsed => ({
        content: marked(parsed.body).toString(),
        ...parsed.attributes
      }));

    this.projectsSignal.set(projects);
  }
}
