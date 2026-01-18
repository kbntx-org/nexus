import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X } from 'lucide-angular';

import { FileTreeComponent } from '../file-tree/file-tree.component';

@Component({
  selector: 'app-file-tree-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FileTreeComponent],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ X })
    }
  ],
  styles: `
    @keyframes slide-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `,
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 lg:hidden" (click)="onClose()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          class="animate-slide-up absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-lg border-t border-border bg-card shadow-lg"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 class="text-lg font-semibold text-foreground">Browse Files</h2>
            <button
              class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              (click)="onClose()"
            >
              <lucide-angular name="x" class="h-5 w-5"></lucide-angular>
            </button>
          </div>
          <div class="h-[calc(85vh-4rem)] overflow-auto">
            <app-file-tree></app-file-tree>
          </div>
        </div>
      </div>
    }
  `
})
export class FileTreeModalComponent {
  @Input() public isOpen = false;
  @Output() public closed = new EventEmitter<void>();

  public onClose(): void {
    this.closed.emit();
  }
}
