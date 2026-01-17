import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconData,
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

import { FileTreeNode } from '../../models/file-tree.model';
import { FileTreeService } from '../../services/file-tree.service';

@Component({
  selector: 'app-file-tree-node',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="select-none">
      <div
        class="group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 my-0.5 transition-all duration-150"
        [class.bg-accent]="isSelected()"
        [class.text-accent-foreground]="isSelected()"
        [class.hover:bg-muted]="!isSelected()"
        [style.padding-left.px]="depth() * 16 + 8"
        (click)="handleClick()"
      >
        @if (node().type === 'directory') {
          <lucide-angular
            [img]="isExpanded() ? ChevronDownIcon : ChevronRightIcon"
            class="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-150"
          ></lucide-angular>
        } @else {
          <span class="w-4"></span>
        }

        <lucide-angular
          [img]="nodeIcon()"
          class="h-4 w-4 flex-shrink-0"
          [class]="iconColor()"
        ></lucide-angular>

        <span
          class="truncate text-sm"
          [class.font-medium]="node().type === 'directory'"
          [class.text-foreground]="node().type === 'directory'"
          [class.text-muted-foreground]="node().type === 'file' && !isSelected()"
        >
          {{ node().name }}
        </span>
      </div>

      @if (node().type === 'directory' && isExpanded() && node().children) {
        <div class="overflow-hidden">
          @for (child of node().children; track child.path) {
            <app-file-tree-node
              [node]="child"
              [depth]="depth() + 1"
              [selectedPath]="selectedPath()"
              [expandedPaths]="expandedPaths()"
              (fileSelect)="fileSelect.emit($event)"
              (toggleExpand)="toggleExpand.emit($event)"
            ></app-file-tree-node>
          }
        </div>
      }
    </div>
  `
})
export class FileTreeNodeComponent {
  public node = input.required<FileTreeNode>();
  public depth = input(0);
  public selectedPath = input('');
  public expandedPaths = input<Set<string>>(new Set());

  public fileSelect = output<FileTreeNode>();
  public toggleExpand = output<string>();

  public readonly ChevronRightIcon = ChevronRight;
  public readonly ChevronDownIcon = ChevronDown;
  public readonly FolderIcon = Folder;
  public readonly FolderOpenIcon = FolderOpen;
  public readonly FileIcon = File;
  public readonly FileCodeIcon = FileCode;
  public readonly FileJsonIcon = FileJson;
  public readonly FileTextIcon = FileText;
  public readonly ImageIcon = Image;
  public readonly SettingsIcon = Settings;
  public readonly TerminalIcon = Terminal;
  public readonly PackageIcon = Package;
  public readonly LockIcon = Lock;

  private readonly fileTreeService = inject(FileTreeService);

  public isExpanded = computed(() => this.expandedPaths().has(this.node().path));

  public isSelected = computed(() => this.selectedPath() === this.node().path);

  public nodeIcon = computed(() => {
    if (this.node().type === 'directory') {
      return this.isExpanded() ? this.FolderOpenIcon : this.FolderIcon;
    }

    const iconType = this.fileTreeService.getFileIconType(this.node().path);

    const iconTypeMap: Record<string, LucideIconData> = {
      typescript: this.FileCodeIcon,
      javascript: this.FileCodeIcon,
      python: this.FileCodeIcon,
      go: this.FileCodeIcon,
      rust: this.FileCodeIcon,
      java: this.FileCodeIcon,
      ruby: this.FileCodeIcon,
      php: this.FileCodeIcon,
      html: this.FileCodeIcon,
      css: this.FileCodeIcon,
      json: this.FileJsonIcon,
      markdown: this.FileTextIcon,
      readme: this.FileTextIcon,
      image: this.ImageIcon,
      config: this.SettingsIcon,
      yaml: this.SettingsIcon,
      terraform: this.SettingsIcon,
      shell: this.TerminalIcon,
      npm: this.PackageIcon,
      lock: this.LockIcon
    };

    return iconTypeMap[iconType] || this.FileIcon;
  });

  public iconColor = computed(() => {
    if (this.node().type === 'directory') {
      return 'text-blue-500';
    }

    const iconType = this.fileTreeService.getFileIconType(this.node().path);

    const colorMap: Record<string, string> = {
      typescript: 'text-blue-600',
      javascript: 'text-yellow-500',
      json: 'text-yellow-600',
      html: 'text-orange-500',
      css: 'text-blue-400',
      python: 'text-green-500',
      markdown: 'text-gray-500',
      readme: 'text-gray-500',
      yaml: 'text-purple-500',
      config: 'text-purple-500',
      shell: 'text-green-600',
      terraform: 'text-violet-600',
      image: 'text-pink-500',
      docker: 'text-sky-500',
      npm: 'text-red-500',
      lock: 'text-gray-400'
    };

    return colorMap[iconType] || 'text-muted-foreground';
  });

  public handleClick(): void {
    if (this.node().type === 'directory') {
      this.toggleExpand.emit(this.node().path);
    } else {
      this.fileSelect.emit(this.node());
    }
  }
}
