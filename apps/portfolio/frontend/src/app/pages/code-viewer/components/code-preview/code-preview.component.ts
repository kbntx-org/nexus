import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, FileCode } from 'lucide-angular';

import { FileTreeService } from '../../services/file-tree.service';
import { TabBarComponent } from '../tab-bar/tab-bar.component';

@Component({
  selector: 'app-code-preview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TabBarComponent],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ FileCode })
    }
  ],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      background: var(--card);
    }
  `,
  template: `
    <app-tab-bar class="shrink-0"></app-tab-bar>

    @if (service.selectedNode$ | async; as selectedNode) {
      <main class="flex-1 overflow-auto">
        @if (service.isImage$ | async) {
          <div class="flex items-center justify-center p-8 text-center">
            <div class="mb-2 text-4xl">🖼️</div>
            <p class="text-muted-foreground">Image preview not available</p>
          </div>
        } @else if (service.isBinaryFile$ | async) {
          <div class="flex items-center justify-center p-8 text-center">
            <div class="mb-2 text-4xl">📦</div>
            <p class="text-muted-foreground">Binary file - cannot display</p>
          </div>
        } @else if (service.isCodeLoading$ | async) {
          <div class="flex items-center justify-center p-8">
            <div
              class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary"
            ></div>
          </div>
        } @else {
          <div
            class="min-h-full [&>pre]:m-0 [&>pre]:min-h-full [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-sm"
            [innerHTML]="service.codeHtml$ | async"
          ></div>
        }
      </main>
    } @else {
      <div class="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <lucide-angular name="file-code" class="h-10 w-10 text-muted-foreground"></lucide-angular>
        </div>
        <h3 class="text-lg font-medium text-foreground">Select a file to view</h3>
        <p class="text-sm text-muted-foreground">
          Click on any file in the tree to view its contents
        </p>
      </div>
    }
  `
})
export class CodePreviewComponent {
  public readonly service = inject(FileTreeService);
}
