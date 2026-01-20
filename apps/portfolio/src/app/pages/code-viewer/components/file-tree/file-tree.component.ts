import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  FolderGit2,
  Search,
  ChevronsDown,
  ChevronsUp
} from 'lucide-angular';

import { FileTreeService } from '../../services/file-tree.service';
import { FileTreeNodeComponent } from '../file-tree-node/file-tree-node.component';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FileTreeNodeComponent],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ FolderGit2, Search, ChevronsDown, ChevronsUp })
    }
  ],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
    }
  `,
  template: `
    <header class="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
      <div class="flex items-center gap-2">
        <lucide-angular name="folder-git-2" class="h-5 w-5 text-muted-foreground"></lucide-angular>
        <span class="text-sm font-medium text-foreground">{{ service.repoName$ | async }}</span>
      </div>
      <button
        class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        (click)="service.toggleExpandAll()"
        [title]="(service.areAllExpanded$ | async) ? 'Collapse all' : 'Expand all'"
      >
        <lucide-angular
          [name]="(service.areAllExpanded$ | async) ? 'chevrons-up' : 'chevrons-down'"
          class="h-4 w-4"
        ></lucide-angular>
      </button>
    </header>

    <div class="shrink-0 border-b border-border p-2">
      <div class="relative">
        <lucide-angular
          name="search"
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        ></lucide-angular>
        <input
          type="text"
          placeholder="Search files..."
          class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          [ngModel]="service.searchQuery$ | async"
          (ngModelChange)="service.setSearchQuery($event)"
        />
      </div>
    </div>

    <nav class="flex-1 overflow-auto p-2">
      @if (service.isLoading$ | async) {
        <div class="flex items-center justify-center py-8">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary"></div>
        </div>
      } @else if ((service.filteredTree$ | async)?.children?.length) {
        @for (child of (service.filteredTree$ | async)!.children; track child.path) {
          <app-file-tree-node [node]="child" [depth]="0"></app-file-tree-node>
        }
      } @else {
        <p class="py-8 text-center text-sm text-muted-foreground">No files found</p>
      }
    </nav>
  `
})
export class FileTreeComponent {
  public readonly service = inject(FileTreeService);
}
