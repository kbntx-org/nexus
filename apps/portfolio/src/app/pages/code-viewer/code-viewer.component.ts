import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, PanelLeftClose, PanelLeft } from 'lucide-angular';

import { CodePreviewComponent } from './components/code-preview/code-preview.component';
import { FileTreeComponent } from './components/file-tree/file-tree.component';
import { getCodeSourceById } from './data/data';
import { FileTreeNode } from './models/file-tree.model';
import { FileTreeService } from './services/file-tree.service';

@Component({
  selector: 'app-code-viewer',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FileTreeComponent,
    CodePreviewComponent
  ],
  styles: `
    :host {
      --scrollbar-thumb: hsl(var(--muted-foreground) / 0.3);
      --scrollbar-thumb-hover: hsl(var(--muted-foreground) / 0.5);
    }

    :host ::ng-deep *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    :host ::ng-deep *::-webkit-scrollbar-track {
      background: transparent;
    }

    :host ::ng-deep *::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-thumb);
      border-radius: 4px;
    }

    :host ::ng-deep *::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-thumb-hover);
    }

    :host ::ng-deep * {
      scrollbar-width: thin;
      scrollbar-color: var(--scrollbar-thumb) transparent;
    }
  `,
  template: `
    <div class="bg-background text-foreground min-h-screen py-8 md:py-12">
      <div class="mx-auto max-w-7xl px-4">
        <div
          class="animate-slide-in-up opacity-0"
          style="animation-delay: 0.1s; animation-fill-mode: forwards"
        >
          <div
            class="bg-card border-border overflow-hidden rounded-lg border shadow-lg"
          >
            <div class="flex flex-col lg:hidden">
              <div class="border-b border-border p-2">
                <button
                  class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  (click)="toggleSidebar()"
                >
                  <lucide-angular
                    [img]="isSidebarOpen() ? PanelLeftCloseIcon : PanelLeftIcon"
                    class="h-4 w-4"
                  ></lucide-angular>
                  {{ isSidebarOpen() ? 'Hide Files' : 'Show Files' }}
                </button>
              </div>

              @if (isSidebarOpen()) {
                <div class="h-[300px] border-b border-border">
                  <app-file-tree
                    [tree]="fileTree()"
                    [repoName]="codeSource()?.name || ''"
                    [isLoading]="isLoading()"
                    (fileSelected)="onFileSelected($event)"
                  ></app-file-tree>
                </div>
              }

              <div class="h-[500px]">
                <app-code-preview [file]="selectedFile()"></app-code-preview>
              </div>
            </div>

            <div class="hidden lg:flex">
              <div
                class="h-[800px] border-r border-border transition-all duration-300"
                [class.w-72]="isSidebarOpen()"
                [class.w-0]="!isSidebarOpen()"
                [class.overflow-hidden]="!isSidebarOpen()"
              >
                <app-file-tree
                  [tree]="fileTree()"
                  [repoName]="codeSource()?.name || ''"
                  [isLoading]="isLoading()"
                  (fileSelected)="onFileSelected($event)"
                ></app-file-tree>
              </div>

              <button
                class="flex h-[800px] w-6 items-center justify-center border-r border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                (click)="toggleSidebar()"
                [title]="isSidebarOpen() ? 'Hide sidebar' : 'Show sidebar'"
              >
                <lucide-angular
                  [img]="isSidebarOpen() ? PanelLeftCloseIcon : PanelLeftIcon"
                  class="h-4 w-4"
                ></lucide-angular>
              </button>

              <div class="h-[800px] flex-1">
                <app-code-preview [file]="selectedFile()"></app-code-preview>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CodeViewerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fileTreeService = inject(FileTreeService);

  public codeSource = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? getCodeSourceById(id) : undefined;
  });

  public fileTree = signal<FileTreeNode | null>(null);
  public selectedFile = signal<FileTreeNode | null>(null);
  public isLoading = signal(true);
  public isSidebarOpen = signal(true);

  public readonly PanelLeftCloseIcon = PanelLeftClose;
  public readonly PanelLeftIcon = PanelLeft;

  constructor() {
    effect(() => {
      const source = this.codeSource();
      if (source?.zipUrl) {
        this.loadRepository(source.zipUrl);
      }
    });
  }

  private async loadRepository(zipUrl: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const tree = await this.fileTreeService.loadFromZipUrl(zipUrl);
      this.fileTree.set(tree);
    } catch (error) {
      console.error('Failed to load repository:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  public onFileSelected(file: FileTreeNode): void {
    this.selectedFile.set(file);
    if (window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  public toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }
}
