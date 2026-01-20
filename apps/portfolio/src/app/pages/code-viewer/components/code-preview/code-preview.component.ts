import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, FileCode } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

import { ThemeService } from '../../../../shared/services/theme.service';
import { FileTreeService } from '../../services/file-tree.service';

@Component({
  selector: 'app-code-preview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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
      background: hsl(var(--card));
    }
  `,
  template: `
    @if (service.selectedNode$ | async; as selectedNode) {
      <header
        class="flex shrink-0 items-center gap-2 overflow-hidden border-b border-border bg-muted/30 px-4 py-3"
      >
        <lucide-angular
          name="file-code"
          class="h-4 w-4 shrink-0 text-muted-foreground"
        ></lucide-angular>
        <span class="truncate text-sm font-medium text-foreground">{{ selectedNode.path }}</span>
      </header>

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
export class CodePreviewComponent implements OnInit, OnDestroy {
  public readonly service = inject(FileTreeService);
  private readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  public ngOnInit(): void {
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.service.reloadCodeHighlighting());
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
