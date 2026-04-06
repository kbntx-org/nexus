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
      display: flex;
      width: 100%;
      height: 100%;
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
    <div class="h-full w-full p-4">
      <div
        class="flex h-full w-full overflow-hidden rounded-xl border border-white/10 bg-night-card/40 backdrop-blur-sm shadow-lg"
      >
        <!-- Mobile view -->
        <div class="flex h-full w-full flex-col lg:hidden">
          @if ((service.selectedNode$ | async) === null) {
            <div class="flex flex-1 flex-col items-center justify-center gap-6 p-8">
              <div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
                <lucide-angular
                  name="folder-open"
                  class="h-12 w-12 text-night-text-muted"
                ></lucide-angular>
              </div>
              <h3 class="text-xl font-medium text-night-text">Browse Source Code</h3>
              <p class="text-sm text-night-text-muted">
                Select a file from the repository to view its contents
              </p>
              <button
                class="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-night-gold to-night-gold-deep px-6 py-3 text-sm font-medium text-night-sky transition-colors hover:brightness-110"
                (click)="openFileTreeModal()"
              >
                <lucide-angular name="folder-open" class="h-4 w-4"></lucide-angular>
                Browse Files
              </button>
            </div>
          } @else {
            <app-code-preview class="flex-1 overflow-hidden"></app-code-preview>
            <div class="border-t border-white/10 p-3">
              <button
                class="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-night-text transition-colors hover:bg-white/10 hover:text-night-text"
                (click)="openFileTreeModal()"
              >
                <lucide-angular name="folder-open" class="h-4 w-4"></lucide-angular>
                Browse Files
              </button>
            </div>
          }
        </div>

        <!-- Desktop view -->
        <div class="hidden h-full w-full lg:flex">
          <app-file-tree
            class="h-full overflow-hidden border-r border-white/10 transition-all duration-300"
            [class.w-72]="isSidebarOpen$ | async"
            [class.w-0]="(isSidebarOpen$ | async) === false"
          ></app-file-tree>

          <button
            class="flex h-full w-6 shrink-0 items-center justify-center border-r border-white/10 bg-white/5 text-night-text-muted transition-colors hover:bg-white/5 hover:text-night-text"
            (click)="toggleSidebar()"
            [title]="(isSidebarOpen$ | async) ? 'Hide sidebar' : 'Show sidebar'"
          >
            <lucide-angular
              [name]="(isSidebarOpen$ | async) ? 'panel-left-close' : 'panel-left'"
              class="h-4 w-4"
            ></lucide-angular>
          </button>

          <app-code-preview class="h-full flex-1 overflow-hidden"></app-code-preview>
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
