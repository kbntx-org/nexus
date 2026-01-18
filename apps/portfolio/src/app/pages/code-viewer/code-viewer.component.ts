import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  PanelLeftClose,
  PanelLeft,
  FolderOpen
} from 'lucide-angular';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

import { CodePreviewComponent } from './components/code-preview/code-preview.component';
import { FileTreeComponent } from './components/file-tree/file-tree.component';
import { FileTreeModalComponent } from './components/file-tree-modal/file-tree-modal.component';
import { getCodeSourceById } from './data/data';
import { FileTreeService } from './services/file-tree.service';

@Component({
  selector: 'app-code-viewer',
  standalone: true,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ PanelLeftClose, PanelLeft, FolderOpen })
    }
  ],
  imports: [
    CommonModule,
    LucideAngularModule,
    FileTreeComponent,
    CodePreviewComponent,
    FileTreeModalComponent
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
    <div class="min-h-screen bg-background pb-8 pt-4 text-foreground md:pb-12 md:pt-6">
      <div class="mx-auto max-w-7xl px-4">
        <div
          class="animate-slide-in-up opacity-0"
          style="animation-delay: 0.1s; animation-fill-mode: forwards"
        >
          <div class="overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <div class="flex flex-col lg:hidden">
              <div class="flex h-[calc(100vh-8rem)] flex-col">
                @if ((service.selectedNode$ | async) === null) {
                  <div class="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <div class="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                      <lucide-angular
                        name="folder-open"
                        class="h-12 w-12 text-muted-foreground"
                      ></lucide-angular>
                    </div>
                    <div class="text-center">
                      <h3 class="mb-2 text-xl font-medium text-foreground">Browse Source Code</h3>
                      <p class="mb-6 text-sm text-muted-foreground">
                        Select a file from the repository to view its contents
                      </p>
                      <button
                        class="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        (click)="openFileTreeModal()"
                      >
                        <lucide-angular name="folder-open" class="h-4 w-4"></lucide-angular>
                        Browse Files
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="flex-1 overflow-hidden">
                    <app-code-preview></app-code-preview>
                  </div>
                  <div class="border-t border-border p-3">
                    <button
                      class="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      (click)="openFileTreeModal()"
                    >
                      <lucide-angular name="folder-open" class="h-4 w-4"></lucide-angular>
                      Browse Files
                    </button>
                  </div>
                }
              </div>
            </div>

            <div class="hidden lg:flex">
              <div
                class="h-[800px] border-r border-border transition-all duration-300"
                [class.w-72]="isSidebarOpen$ | async"
                [class.w-0]="(isSidebarOpen$ | async) === false"
                [class.overflow-hidden]="(isSidebarOpen$ | async) === false"
              >
                <app-file-tree></app-file-tree>
              </div>

              <button
                class="flex h-[800px] w-6 items-center justify-center border-r border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                (click)="toggleSidebar()"
                [title]="(isSidebarOpen$ | async) ? 'Hide sidebar' : 'Show sidebar'"
              >
                <lucide-angular
                  [name]="(isSidebarOpen$ | async) ? 'panel-left-close' : 'panel-left'"
                  class="h-4 w-4"
                ></lucide-angular>
              </button>

              <div class="h-[800px] flex-1">
                <app-code-preview></app-code-preview>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-file-tree-modal
      [isOpen]="(isFileTreeModalOpen$ | async) ?? false"
      (closed)="closeFileTreeModal()"
    ></app-file-tree-modal>
  `
})
export class CodeViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  public readonly service = inject(FileTreeService);
  private readonly destroy$ = new Subject<void>();

  private isSidebarOpenSubject = new BehaviorSubject<boolean>(true);
  public isSidebarOpen$ = this.isSidebarOpenSubject.asObservable();

  private isFileTreeModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isFileTreeModalOpen$ = this.isFileTreeModalOpenSubject.asObservable();

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const source = id ? getCodeSourceById(id) : undefined;

    if (source?.zipUrl) {
      this.service.loadRepository(source.zipUrl, source.name);
    }

    this.service.selectedNode$.pipe(takeUntil(this.destroy$)).subscribe(node => {
      if (node && window.innerWidth < 1024) {
        this.closeFileTreeModal();
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public openFileTreeModal(): void {
    this.isFileTreeModalOpenSubject.next(true);
  }

  public closeFileTreeModal(): void {
    this.isFileTreeModalOpenSubject.next(false);
  }

  public toggleSidebar(): void {
    this.isSidebarOpenSubject.next(!this.isSidebarOpenSubject.value);
  }
}
