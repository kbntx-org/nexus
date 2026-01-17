import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FolderGit2, Search } from 'lucide-angular';

import { FileTreeNode } from '../../models/file-tree.model';
import { FileTreeNodeComponent } from '../file-tree-node/file-tree-node.component';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FileTreeNodeComponent],
  template: `
    <div class="flex h-full flex-col">
      <div
        class="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3"
      >
        <lucide-angular
          [img]="FolderGitIcon"
          class="h-5 w-5 text-muted-foreground"
        ></lucide-angular>
        <span class="text-sm font-medium text-foreground">{{ repoName() }}</span>
      </div>

      <div class="border-b border-border p-2">
        <div class="relative">
          <lucide-angular
            [img]="SearchIcon"
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          ></lucide-angular>
          <input
            type="text"
            placeholder="Search files..."
            class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
      </div>

      <div class="flex-1 overflow-auto p-2">
        @if (isLoading()) {
          <div class="flex items-center justify-center py-8">
            <div
              class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary"
            ></div>
          </div>
        } @else if (filteredTree() && filteredTree()!.children?.length) {
          @for (child of filteredTree()!.children; track child.path) {
            <app-file-tree-node
              [node]="child"
              [depth]="0"
              [selectedPath]="selectedPath()"
              [expandedPaths]="expandedPaths()"
              (fileSelect)="onFileSelect($event)"
              (toggleExpand)="onToggleExpand($event)"
            ></app-file-tree-node>
          }
        } @else {
          <div class="py-8 text-center text-sm text-muted-foreground">
            No files found
          </div>
        }
      </div>
    </div>
  `
})
export class FileTreeComponent {
  public tree = input<FileTreeNode | null>(null);
  public repoName = input('Repository');
  public isLoading = input(false);

  public fileSelected = output<FileTreeNode>();

  public searchQuery = signal('');
  public selectedPath = signal('');
  public expandedPaths = signal<Set<string>>(new Set());

  public readonly FolderGitIcon = FolderGit2;
  public readonly SearchIcon = Search;

  public filteredTree = computed(() => {
    const currentTree = this.tree();
    if (!currentTree) {
      return null;
    }

    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return currentTree;
    }

    return this.filterTree(currentTree, query);
  });

  private filterTree(node: FileTreeNode, query: string): FileTreeNode | null {
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(query) ? node : null;
    }

    const filteredChildren = node.children
      ?.map(child => this.filterTree(child, query))
      .filter((child): child is FileTreeNode => child !== null);

    if (!filteredChildren?.length && !node.name.toLowerCase().includes(query)) {
      return null;
    }

    return {
      ...node,
      children: filteredChildren
    };
  }

  public onSearchChange(query: string): void {
    this.searchQuery.set(query);

    if (query.trim() && this.tree()) {
      this.expandAllPaths(this.tree()!);
    }
  }

  public onFileSelect(node: FileTreeNode): void {
    this.selectedPath.set(node.path);
    this.fileSelected.emit(node);
  }

  public onToggleExpand(path: string): void {
    this.expandedPaths.update(paths => {
      const newPaths = new Set(paths);
      if (newPaths.has(path)) {
        newPaths.delete(path);
      } else {
        newPaths.add(path);
      }
      return newPaths;
    });
  }

  private expandAllPaths(node: FileTreeNode): void {
    this.expandedPaths.update(paths => {
      const newPaths = new Set(paths);
      this.collectDirectoryPaths(node, newPaths);
      return newPaths;
    });
  }

  private collectDirectoryPaths(node: FileTreeNode, paths: Set<string>): void {
    if (node.type === 'directory') {
      paths.add(node.path);
      node.children?.forEach(child => this.collectDirectoryPaths(child, paths));
    }
  }

  public expandToPath(path: string): void {
    const parts = path.split('/');
    let currentPath = '';

    this.expandedPaths.update(paths => {
      const newPaths = new Set(paths);
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        newPaths.add(currentPath);
      }
      return newPaths;
    });

    this.selectedPath.set(path);
  }
}
