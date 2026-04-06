import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  X,
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

import { getIconColor, getIconName, getIconType } from '../../models/file-mappings.model';
import { FileTreeService } from '../../services/file-tree.service';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        X,
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
  styles: `
    :host {
      display: block;
    }

    .tab-container {
      scrollbar-width: none;
    }

    .tab-container::-webkit-scrollbar {
      display: none;
    }
  `,
  template: `
    @if ((service.openTabs$ | async)?.length) {
      <div
        class="tab-container flex overflow-x-auto border-b border-border bg-muted/30"
      >
        @for (tab of service.openTabs$ | async; track tab.node.path; let index = $index) {
          <button
            class="group flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-2 text-sm transition-colors"
            [class.bg-card]="(service.activeTabIndex$ | async) === index"
            [class.border-b-2]="(service.activeTabIndex$ | async) === index"
            [class.border-b-primary]="(service.activeTabIndex$ | async) === index"
            [class.text-foreground]="(service.activeTabIndex$ | async) === index"
            [class.text-muted-foreground]="(service.activeTabIndex$ | async) !== index"
            [class.hover:bg-muted]="(service.activeTabIndex$ | async) !== index"
            (click)="service.activateTabByIndex(index)"
            (mousedown)="handleMiddleClick($event, index)"
          >
            <lucide-angular
              [name]="getFileIconName(tab.node.path)"
              class="h-3.5 w-3.5 shrink-0"
              [class]="getFileIconColor(tab.node.path)"
            ></lucide-angular>

            <span class="max-w-40 truncate">{{ tab.node.name }}</span>

            <lucide-angular
              name="x"
              class="h-3.5 w-3.5 shrink-0 rounded opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover:opacity-100"
              [class.opacity-100]="(service.activeTabIndex$ | async) === index"
              (click)="closeTab($event, index)"
            ></lucide-angular>
          </button>
        }
      </div>
    }
  `
})
export class TabBarComponent {
  public readonly service = inject(FileTreeService);

  public getFileIconName(path: string): string {
    return getIconName(path);
  }

  public getFileIconColor(path: string): string {
    return getIconColor(getIconType(path));
  }

  public closeTab(event: Event, index: number): void {
    event.stopPropagation();
    this.service.closeTab(index);
  }

  public handleMiddleClick(event: MouseEvent, index: number): void {
    if (event.button === 1) {
      event.preventDefault();
      this.service.closeTab(index);
    }
  }
}
