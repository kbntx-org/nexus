import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

export interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
  longDescription?: string;
  features?: string[];
  liveUrl?: string;
  githubUrl?: string;
  images?: string[];
}

@Component({
  selector: 'app-project-modal',
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      (click)="closeModal()"
    >
      <div
        class="bg-card border-border custom-scrollbar relative mx-4 box-border hidden max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border shadow-2xl lg:block"
        (click)="$event.stopPropagation()"
      >
        <button
          class="bg-background border-border text-foreground hover:bg-accent absolute right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
          (click)="closeModal()"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="border-border border-b p-8 pb-4">
          <h2 class="text-foreground mb-2 text-3xl font-bold">{{ project.title }}</h2>
          <p class="text-muted-foreground text-lg leading-relaxed">{{ project.description }}</p>
        </div>

        <div class="p-8 pt-6">
          <div class="mb-8" *ngIf="project.images && project.images.length > 0">
            <div class="relative overflow-hidden rounded-lg">
              <div class="h-80 w-full overflow-hidden">
                <div
                  class="flex h-full w-full transition-transform duration-300 ease-in-out"
                  [style.transform]="'translateX(-' + currentImageIndex * 100 + '%)'"
                >
                  <div
                    class="bg-muted flex h-full min-w-full items-center justify-center"
                    *ngFor="let image of project.images; let i = index"
                  >
                    <div
                      class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-2xl font-semibold text-white"
                    >
                      {{ project.title.charAt(0) }}
                    </div>
                  </div>
                </div>
              </div>

              <button
                class="bg-background/90 border-border text-foreground hover:bg-accent z-5 absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
                (click)="previousImage()"
                *ngIf="project.images.length > 1"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>

              <button
                class="bg-background/90 border-border text-foreground hover:bg-accent z-5 absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
                (click)="nextImage()"
                *ngIf="project.images.length > 1"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>

              <div
                class="z-5 absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
                *ngIf="project.images.length > 1"
              >
                <button
                  class="h-2 w-2 rounded-full transition-all duration-200"
                  [class]="
                    i === currentImageIndex
                      ? 'bg-primary scale-125'
                      : 'bg-muted-foreground/50 hover:bg-muted-foreground/80'
                  "
                  *ngFor="let image of project.images; let i = index"
                  (click)="goToImage(i)"
                ></button>
              </div>
            </div>
          </div>

          <div class="space-y-8">
            <div>
              <h3 class="text-foreground mb-4 text-xl font-semibold">About this project</h3>
              <p class="text-muted-foreground leading-relaxed">
                {{ project.longDescription || project.description }}
              </p>
            </div>

            <div *ngIf="project.features && project.features.length > 0">
              <h3 class="text-foreground mb-4 text-xl font-semibold">Key Features</h3>
              <ul class="space-y-2">
                <li
                  class="text-muted-foreground flex items-start gap-3"
                  *ngFor="let feature of project.features"
                >
                  <span class="text-primary mt-0.5 font-bold">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-foreground mb-4 text-xl font-semibold">Technologies Used</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  class="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm font-medium"
                  *ngFor="let tech of project.tech"
                  >{{ tech }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="border-border bg-muted/30 border-t p-8 pt-6">
          <div class="flex w-full flex-wrap gap-4">
            <a
              *ngIf="project.liveUrl"
              [href]="project.liveUrl"
              target="_blank"
              class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-6 py-3 font-medium transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15,3 21,3 21,9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Live Demo
            </a>
            <a
              *ngIf="project.githubUrl"
              [href]="project.githubUrl"
              target="_blank"
              class="text-foreground border-border hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-md border bg-transparent px-6 py-3 font-medium transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                ></path>
              </svg>
              View Code
            </a>
          </div>
        </div>
      </div>

      <div
        class="bg-card border-border fixed bottom-0 left-0 right-0 max-h-[85vh] transform overflow-y-auto rounded-t-2xl border-t shadow-2xl transition-transform duration-300 ease-out lg:hidden"
        [class]="isOpening ? 'translate-y-0' : 'translate-y-full'"
        (click)="$event.stopPropagation()"
      >
        <button
          class="bg-background border-border text-foreground hover:bg-accent absolute right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
          (click)="closeModal()"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="border-border border-b p-6 pb-4">
          <h2 class="text-foreground mb-2 pr-12 text-2xl font-bold">{{ project.title }}</h2>
          <p class="text-muted-foreground text-base leading-relaxed">{{ project.description }}</p>
        </div>

        <div class="p-6 pt-4">
          <div class="mb-6" *ngIf="project.images && project.images.length > 0">
            <div class="relative overflow-hidden rounded-lg">
              <div class="h-48 w-full overflow-hidden">
                <div
                  class="flex h-full w-full transition-transform duration-300 ease-in-out"
                  [style.transform]="'translateX(-' + currentImageIndex * 100 + '%)'"
                >
                  <div
                    class="bg-muted flex h-full min-w-full items-center justify-center"
                    *ngFor="let image of project.images; let i = index"
                  >
                    <div
                      class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-xl font-semibold text-white"
                    >
                      {{ project.title.charAt(0) }}
                    </div>
                  </div>
                </div>
              </div>

              <button
                class="bg-background/90 border-border text-foreground hover:bg-accent z-5 absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
                (click)="previousImage()"
                *ngIf="project.images.length > 1"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>

              <button
                class="bg-background/90 border-border text-foreground hover:bg-accent z-5 absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110"
                (click)="nextImage()"
                *ngIf="project.images.length > 1"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>

              <div
                class="z-5 absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5"
                *ngIf="project.images.length > 1"
              >
                <button
                  class="h-1.5 w-1.5 rounded-full transition-all duration-200"
                  [class]="
                    i === currentImageIndex
                      ? 'bg-primary scale-125'
                      : 'bg-muted-foreground/50 hover:bg-muted-foreground/80'
                  "
                  *ngFor="let image of project.images; let i = index"
                  (click)="goToImage(i)"
                ></button>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <h3 class="text-foreground mb-3 text-lg font-semibold">About this project</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {{ project.longDescription || project.description }}
              </p>
            </div>

            <div *ngIf="project.features && project.features.length > 0">
              <h3 class="text-foreground mb-3 text-lg font-semibold">Key Features</h3>
              <ul class="space-y-2">
                <li
                  class="text-muted-foreground flex items-start gap-3 text-sm"
                  *ngFor="let feature of project.features"
                >
                  <span class="text-primary mt-0.5 font-bold">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-foreground mb-3 text-lg font-semibold">Technologies Used</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  class="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-medium"
                  *ngFor="let tech of project.tech"
                  >{{ tech }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="border-border bg-card sticky bottom-0 border-t p-6 pt-4">
          <div class="flex gap-3">
            <a
              *ngIf="project.liveUrl"
              [href]="project.liveUrl"
              target="_blank"
              class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 font-medium transition-all duration-200 active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15,3 21,3 21,9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Live Demo
            </a>
            <a
              *ngIf="project.githubUrl"
              [href]="project.githubUrl"
              target="_blank"
              class="text-foreground border-border hover:bg-accent hover:text-accent-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-md border bg-transparent px-4 py-3 font-medium transition-all duration-200 active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                ></path>
              </svg>
              View Code
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: hsl(var(--muted-foreground) / 0.3);
        border-radius: 4px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground) / 0.5);
      }

      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        box-sizing: border-box;
      }
    `
  ]
})
export class ProjectModalComponent implements OnInit, OnDestroy {
  @Input() public project!: Project;
  @Output() public modalClose = new EventEmitter<void>();

  public currentImageIndex = 0;
  public isOpening = false;

  public ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      this.isOpening = true;
    }, 10);
  }

  public ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  public closeModal(): void {
    this.modalClose.emit();
  }

  public nextImage(): void {
    if (this.project.images && this.project.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.project.images.length;
    }
  }

  public previousImage(): void {
    if (this.project.images && this.project.images.length > 1) {
      this.currentImageIndex =
        this.currentImageIndex === 0 ? this.project.images.length - 1 : this.currentImageIndex - 1;
    }
  }

  public goToImage(index: number): void {
    this.currentImageIndex = index;
  }
}
