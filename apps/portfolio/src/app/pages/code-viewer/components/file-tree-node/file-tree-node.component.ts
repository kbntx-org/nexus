import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  Image,
  Settings,
  Terminal,
  Package,
  Lock
} from 'lucide-angular';
import { map } from 'rxjs';

import { getIconColor, getIconName, getIconType } from '../../models/file-mappings.model';
import { FileTreeNode } from '../../models/file-tree.model';
import { FileTreeService } from '../../services/file-tree.service';

@Component({
  selector: 'app-file-tree-node',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ChevronRight,
        ChevronDown,
        Folder,
        FolderOpen,
        File,
        FileCode,
        FileJson,
        FileText,
        Image,
        Settings,
        Terminal,
        Package,
        Lock
      })
    }
  ],
  template: `
    <div class="select-none">
      <div
        class="group my-0.5 flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 transition-all duration-150"
        [class.bg-accent]="isSelected$ | async"
        [class.text-accent-foreground]="isSelected$ | async"
        [class.hover:bg-muted]="(isSelected$ | async) === false"
        [style.padding-left.px]="depth * 16 + 8"
        (click)="handleClick()"
      >
        @if (node.type === 'directory') {
          <lucide-angular
            [name]="(isExpanded$ | async) ? 'chevron-down' : 'chevron-right'"
            class="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-150"
          ></lucide-angular>
        } @else {
          <span class="w-4"></span>
        }

        <lucide-angular
          [name]="iconName$ | async"
          class="h-4 w-4 flex-shrink-0"
          [class]="iconColor"
        ></lucide-angular>

        <span
          class="truncate text-sm"
          [class.font-medium]="node.type === 'directory'"
          [class.text-foreground]="node.type === 'directory'"
          [class.text-muted-foreground]="node.type === 'file' && (isSelected$ | async) === false"
          [title]="node.name"
        >
          {{ node.name }}
        </span>
      </div>

      @if (node.type === 'directory' && (isExpanded$ | async) && node.children) {
        <div class="overflow-hidden">
          @for (child of node.children; track child.path) {
            <app-file-tree-node [node]="child" [depth]="depth + 1"></app-file-tree-node>
          }
        </div>
      }
    </div>
  `
})
export class FileTreeNodeComponent {
  private readonly service = inject(FileTreeService);

  @Input() public node!: FileTreeNode;
  @Input() public depth = 0;

  public isExpanded$ = this.service.tree$.pipe(map(() => this.node?.expanded ?? false));

  public isSelected$ = this.service.selectedNode$.pipe(map(selected => selected === this.node));

  public iconName$ = this.service.tree$.pipe(
    map(() => {
      if (this.node?.type === 'directory') {
        return this.node.expanded ? 'folder-open' : 'folder';
      }
      return getIconName(this.node?.path ?? '');
    })
  );

  public get iconColor(): string {
    if (this.node?.type === 'directory') {
      return 'text-blue-500';
    }
    return getIconColor(getIconType(this.node?.path ?? ''));
  }

  public handleClick(): void {
    if (this.node.type === 'directory') {
      this.service.toggleExpand(this.node);
    } else {
      this.service.selectFile(this.node);
    }
  }
}
