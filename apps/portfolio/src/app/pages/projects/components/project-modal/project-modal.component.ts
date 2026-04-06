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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
      (click)="closeModal()"
    >
      <div
        class="relative mx-4 box-border hidden max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-night-card/50 shadow-2xl shadow-black/40 backdrop-blur-xl lg:flex"
        (click)="$event.stopPropagation()"
      >
        <div class="z-20 flex flex-shrink-0 items-center justify-between px-8 py-5">
          <h2 class="text-2xl font-bold text-night-text">{{ project.title }}</h2>
          <div class="flex items-center gap-1">
            <a
              *ngIf="project.githubUrl"
              [href]="project.githubUrl"
              target="_blank"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-night-text-muted transition-all duration-200 hover:bg-white/10 hover:text-night-text"
            >
              <lucide-angular [img]="GithubIcon" class="h-4 w-4"></lucide-angular>
            </a>
            <a
              *ngIf="project.codeSourceUrl"
              [routerLink]="project.codeSourceUrl"
              (click)="closeModal()"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-night-text-muted transition-all duration-200 hover:bg-white/10 hover:text-night-text"
            >
              <lucide-angular [img]="Code2Icon" class="h-4 w-4"></lucide-angular>
            </a>
            <button
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-night-text-muted transition-all duration-200 hover:bg-white/10 hover:text-night-text"
              (click)="closeModal()"
            >
              <lucide-angular [img]="XIcon" class="h-5 w-5"></lucide-angular>
            </button>
          </div>
        </div>

        <div class="custom-scrollbar overflow-y-auto px-8 pb-8">
          <div class="mb-8 overflow-hidden rounded-xl border border-white/5" *ngIf="project.images && project.images.length > 0">
            <div class="relative h-80 w-full overflow-hidden bg-night-sky/30">
              <div
                class="flex h-full w-full transition-transform duration-500 ease-out"
                [style.transform]="'translateX(-' + currentImageIndex * 100 + '%)'"
              >
                <div
                  class="h-full w-full flex-shrink-0"
                  *ngFor="let image of project.images; let i = index"
                >
                  <img
                    [src]="image"
                    [alt]="project.title + ' image ' + (i + 1)"
                    class="h-full w-full object-contain p-4"
                  />
                </div>
              </div>

              <button
                class="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-night-sky/60 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-night-sky/80 hover:text-white"
                (click)="previousImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronLeftIcon" class="h-4 w-4"></lucide-angular>
              </button>

              <button
                class="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-night-sky/60 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-night-sky/80 hover:text-white"
                (click)="nextImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronRightIcon" class="h-4 w-4"></lucide-angular>
              </button>

              <div
                class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-night-sky/50 px-2.5 py-1.5 backdrop-blur-sm"
                *ngIf="project.images.length > 1"
              >
                <button
                  class="h-1.5 w-1.5 rounded-full transition-all duration-200"
                  [class]="i === currentImageIndex ? 'w-4 bg-night-gold' : 'bg-white/30 hover:bg-white/50'"
                  *ngFor="let image of project.images; let i = index"
                  (click)="goToImage(i)"
                ></button>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <p [innerHTML]="project.content" class="leading-relaxed text-night-text-soft"></p>
            </div>

            <div *ngIf="project.features && project.features.length > 0">
              <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-night-text-muted">Features</h3>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div
                  class="flex items-start gap-2.5"
                  *ngFor="let feature of project.features"
                >
                  <span class="mt-0.5 text-night-gold">✓</span>
                  <span class="text-sm text-night-text-soft">{{ feature }}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-night-text-muted">Stack</h3>
              <div class="flex flex-wrap gap-1.5">
                <span
                  class="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-night-text-muted"
                  *ngFor="let tech of project.tech"
                >{{ tech }}</span>
              </div>
            </div>
          </div>

        </div>

        <div
          class="z-20 flex flex-shrink-0 flex-wrap gap-3 border-t border-white/10 bg-white/5 backdrop-blur-sm px-8 py-5"
          *ngIf="project.liveUrl"
        >
          <a
            [href]="project.liveUrl"
            target="_blank"
            class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-night-gold to-night-gold-deep px-5 py-2.5 text-sm font-medium text-night-sky transition-all duration-200 hover:brightness-110"
          >
            <lucide-angular [img]="ExternalLinkIcon" class="h-4 w-4"></lucide-angular>
            Live Demo
          </a>
        </div>
      </div>

      <div
        class="fixed bottom-0 left-0 right-0 flex max-h-[90svh] transform flex-col overflow-hidden rounded-t-2xl border-t border-white/15 bg-night-card/50 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-300 ease-out lg:hidden"
        [class]="isOpening ? 'translate-y-0' : 'translate-y-full'"
        (click)="$event.stopPropagation()"
      >
        <div class="flex flex-shrink-0 items-center justify-between px-5 py-4">
          <h2 class="text-xl font-bold text-night-text">{{ project.title }}</h2>
          <div class="flex items-center gap-1">
            <a
              *ngIf="project.githubUrl"
              [href]="project.githubUrl"
              target="_blank"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-night-text-muted transition-all duration-200 hover:bg-white/10 hover:text-night-text"
            >
              <lucide-angular [img]="GithubIcon" class="h-4 w-4"></lucide-angular>
            </a>
            <a
              *ngIf="project.codeSourceUrl"
              [routerLink]="project.codeSourceUrl"
              (click)="closeModal()"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-night-text-muted transition-all duration-200 hover:bg-white/10 hover:text-night-text"
            >
              <lucide-angular [img]="Code2Icon" class="h-4 w-4"></lucide-angular>
            </a>
            <button
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-night-text-muted transition-all duration-200 hover:bg-white/10 hover:text-night-text"
              (click)="closeModal()"
            >
              <lucide-angular [img]="XIcon" class="h-5 w-5"></lucide-angular>
            </button>
          </div>
        </div>

        <div class="overflow-y-auto px-5 pb-5">
          <div class="mb-5 overflow-hidden rounded-xl border border-white/5" *ngIf="project.images && project.images.length > 0">
            <div class="relative h-52 w-full overflow-hidden bg-night-sky/30">
              <div
                class="flex h-full w-full transition-transform duration-500 ease-out"
                [style.transform]="'translateX(-' + currentImageIndex * 100 + '%)'"
              >
                <div
                  class="h-full w-full flex-shrink-0"
                  *ngFor="let image of project.images; let i = index"
                >
                  <img
                    [src]="image"
                    [alt]="project.title + ' image ' + (i + 1)"
                    class="h-full w-full object-contain p-3"
                  />
                </div>
              </div>

              <button
                class="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-night-sky/60 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-night-sky/80"
                (click)="previousImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronLeftIcon" class="h-4 w-4"></lucide-angular>
              </button>

              <button
                class="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-night-sky/60 text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-night-sky/80"
                (click)="nextImage()"
                *ngIf="project.images.length > 1"
              >
                <lucide-angular [img]="ChevronRightIcon" class="h-4 w-4"></lucide-angular>
              </button>

              <div
                class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-night-sky/50 px-2 py-1 backdrop-blur-sm"
                *ngIf="project.images.length > 1"
              >
                <button
                  class="h-1.5 w-1.5 rounded-full transition-all duration-200"
                  [class]="i === currentImageIndex ? 'w-3.5 bg-night-gold' : 'bg-white/30 hover:bg-white/50'"
                  *ngFor="let image of project.images; let i = index"
                  (click)="goToImage(i)"
                ></button>
              </div>
            </div>
          </div>

          <div class="space-y-5">
            <div>
              <p
                [innerHTML]="project.content"
                class="text-sm leading-relaxed text-night-text-soft"
              ></p>
            </div>

            <div *ngIf="project.features && project.features.length > 0">
              <h3 class="mb-2.5 text-xs font-semibold uppercase tracking-wider text-night-text-muted">Features</h3>
              <div class="space-y-1.5">
                <div
                  class="flex items-start gap-2.5"
                  *ngFor="let feature of project.features"
                >
                  <span class="mt-0.5 text-night-gold">✓</span>
                  <span class="text-sm text-night-text-soft">{{ feature }}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 class="mb-2.5 text-xs font-semibold uppercase tracking-wider text-night-text-muted">Stack</h3>
              <div class="flex flex-wrap gap-1.5">
                <span
                  class="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-night-text-muted"
                  *ngFor="let tech of project.tech"
                >{{ tech }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex-shrink-0 border-t border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4"
          *ngIf="project.liveUrl"
        >
          <div class="flex flex-wrap gap-2.5">
            <a
              [href]="project.liveUrl"
              target="_blank"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-night-gold to-night-gold-deep px-4 py-2.5 text-sm font-medium text-night-sky transition-all duration-200 hover:brightness-110 active:scale-95"
            >
              <lucide-angular [img]="ExternalLinkIcon" class="h-4 w-4"></lucide-angular>
              Live Demo
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
