import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import fm from 'front-matter';
import { marked } from 'marked';
import { BehaviorSubject, from, mergeMap, toArray } from "rxjs";

const PROJECT_FILES = [
  'assets/content/projects/nexus-observability.md',
  'assets/content/projects/nexus-kubernetes.md',
  'assets/content/projects/nexus-internal-tooling.md',
  'assets/content/projects/portfolio.md'
]

export interface Project {
  title: string;
  description: string;
  tech: string[];
  features: string[];
  content: string;
  liveUrl?: string;
  githubUrl?: string;
  codeSourceUrl?: string;
  images?: string[];
  logo?: string;
}

type ProjectMetadata = Omit<Project, 'content'>

@Injectable()
export class ProjectsService {
  private httpClient = inject(HttpClient)

  private projects = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projects.asObservable();

  constructor() {
    this.loadProjectFiles();
  }

  private loadProjectFiles() {
    from(PROJECT_FILES).pipe(
      mergeMap(file => this.httpClient.get(file, {responseType: 'text'})),
      toArray()
    ).subscribe(results => {
      const mappedData = results.map(result => fm<ProjectMetadata>(result)).map(result => ({
        content: marked(result.body).toString(),
        ...result.attributes
      }))
      this.projects.next(mappedData);
    });
  }

}
