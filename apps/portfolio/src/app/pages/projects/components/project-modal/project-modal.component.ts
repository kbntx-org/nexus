import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Code2
} from 'lucide-angular';

import { Project } from '../../services/projects.service';

@Component({
  selector: 'app-project-modal',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      (click)="closeModal()"
    >
      <div
        class="custom-scrollbar relative mx-4 box-border hidden max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-card shadow-2xl lg:block"
        (click)="$event.stopPropagation()"
      >
        <div class="border-b border-border p-4">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-foreground">{{ project.title }}</h2>
            <button
              class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent"
              (click)="closeModal()"
            >
              <lucide-angular [img]="XIcon" class="h-6 w-6"></lucide-angular>
            </button>
          </div>
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
                    class="h-full w-full flex-shrink-0"
                    *ngFor="let image of project.images; let i = index"
                  >
                    <img
                      [src]="image"
                      [alt]="project.title + ' image ' + (i + 1)"
                      class="h-full w-full object-contain p-2"
                    />
                  </div>
                </div>
              </div>

              <button
                class="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent"
                (click)="previousImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronLeftIcon" class="h-5 w-5"></lucide-angular>
              </button>

              <button
                class="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent"
                (click)="nextImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronRightIcon" class="h-5 w-5"></lucide-angular>
              </button>

              <div
                class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
                *ngIf="project.images.length > 1"
              >
                <button
                  class="h-2 w-2 rounded-full transition-all duration-200"
                  [class]="
                    i === currentImageIndex
                      ? 'scale-125 bg-primary'
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
              <h3 class="mb-4 text-xl font-semibold text-foreground">About this project</h3>
              <p [innerHTML]="project.content" class="leading-relaxed text-muted-foreground"></p>
            </div>
            <div *ngIf="project.features && project.features.length > 0">
              <h3 class="mb-4 text-xl font-semibold text-foreground">Key Features</h3>
              <ul class="space-y-2">
                <li
                  class="flex items-start gap-3 text-muted-foreground"
                  *ngFor="let feature of project.features"
                >
                  <span class="mt-0.5 font-bold text-primary">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="mb-4 text-xl font-semibold text-foreground">Technologies Used</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  class="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                  *ngFor="let tech of project.tech"
                  >{{ tech }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          class="border-t border-border bg-muted/30 p-6"
          *ngIf="project.liveUrl || project.githubUrl || project.codeSourceUrl"
        >
          <div class="flex w-full flex-wrap gap-4">
            <a
              *ngIf="project.liveUrl"
              [href]="project.liveUrl"
              target="_blank"
              class="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
            >
              <lucide-angular [img]="ExternalLinkIcon" class="h-4 w-4"></lucide-angular>
              Live Demo
            </a>
            <a
              *ngIf="project.githubUrl"
              [href]="project.githubUrl"
              target="_blank"
              class="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              <lucide-angular [img]="GithubIcon" class="h-4 w-4"></lucide-angular>
              View Code
            </a>
            <a
              *ngIf="project.codeSourceUrl"
              [routerLink]="project.codeSourceUrl"
              (click)="closeModal()"
              class="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              <lucide-angular [img]="Code2Icon" class="h-4 w-4"></lucide-angular>
              Browse Source
            </a>
          </div>
        </div>
      </div>

      <div
        class="fixed bottom-0 left-0 right-0 max-h-[90svh] transform overflow-y-auto rounded-t-2xl border-t border-border bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden"
        [class]="isOpening ? 'translate-y-0' : 'translate-y-full'"
        (click)="$event.stopPropagation()"
      >
        <div class="border-b border-border p-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-foreground">{{ project.title }}</h2>
            <button
              class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent"
              (click)="closeModal()"
            >
              <lucide-angular [img]="XIcon" class="h-6 w-6"></lucide-angular>
            </button>
          </div>
        </div>

        <div class="p-6 pt-4">
          <div class="mb-6" *ngIf="project.images && project.images.length > 0">
            <div class="relative overflow-hidden rounded-lg">
              <div class="h-56 w-full overflow-hidden">
                <div
                  class="flex h-full w-full transition-transform duration-300 ease-in-out"
                  [style.transform]="'translateX(-' + currentImageIndex * 100 + '%)'"
                >
                  <div
                    class="h-full w-full flex-shrink-0"
                    *ngFor="let image of project.images; let i = index"
                  >
                    <img
                      [src]="image"
                      [alt]="project.title + ' image ' + (i + 1)"
                      class="h-full w-full object-contain p-2"
                    />
                  </div>
                </div>
              </div>

              <button
                class="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent"
                (click)="previousImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronLeftIcon" class="h-4 w-4"></lucide-angular>
              </button>

              <button
                class="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent"
                (click)="nextImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronRightIcon" class="h-4 w-4"></lucide-angular>
              </button>

              <div
                class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
                *ngIf="project.images.length > 1"
              >
                <button
                  class="h-1.5 w-1.5 rounded-full transition-all duration-200"
                  [class]="
                    i === currentImageIndex
                      ? 'scale-125 bg-primary'
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
              <h3 class="mb-3 text-lg font-semibold text-foreground">About this project</h3>
              <p
                [innerHTML]="project.content"
                class="text-sm leading-relaxed text-muted-foreground"
              ></p>
            </div>

            <div *ngIf="project.features && project.features.length > 0">
              <h3 class="mb-3 text-lg font-semibold text-foreground">Key Features</h3>
              <ul class="space-y-2">
                <li
                  class="flex items-start gap-3 text-sm text-muted-foreground"
                  *ngFor="let feature of project.features"
                >
                  <span class="mt-0.5 font-bold text-primary">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="mb-3 text-lg font-semibold text-foreground">Technologies Used</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  class="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                  *ngFor="let tech of project.tech"
                  >{{ tech }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          class="sticky bottom-0 border-t border-border bg-card p-6 pt-4"
          *ngIf="project.liveUrl || project.githubUrl || project.codeSourceUrl"
        >
          <div class="flex flex-wrap gap-3">
            <a
              *ngIf="project.liveUrl"
              [href]="project.liveUrl"
              target="_blank"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              <lucide-angular [img]="ExternalLinkIcon" class="h-4 w-4"></lucide-angular>
              Live Demo
            </a>
            <a
              *ngIf="project.githubUrl"
              [href]="project.githubUrl"
              target="_blank"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-3 font-medium text-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-95"
            >
              <lucide-angular [img]="GithubIcon" class="h-4 w-4"></lucide-angular>
              View Code
            </a>
            <a
              *ngIf="project.codeSourceUrl"
              [routerLink]="project.codeSourceUrl"
              (click)="closeModal()"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-3 font-medium text-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-95"
            >
              <lucide-angular [img]="Code2Icon" class="h-4 w-4"></lucide-angular>
              Browse Source
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

  public readonly XIcon = X;
  public readonly ChevronLeftIcon = ChevronLeft;
  public readonly ChevronRightIcon = ChevronRight;
  public readonly ExternalLinkIcon = ExternalLink;
  public readonly GithubIcon = Github;
  public readonly Code2Icon = Code2;

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
