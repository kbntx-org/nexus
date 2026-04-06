import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Github,
  LucideAngularModule,
  X
} from 'lucide-angular';

import { Project } from '../../services/projects.service';

const MOBILE_BREAKPOINT_PX = 1024;

@Component({
  selector: 'app-project-modal',
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './project-modal.component.html',
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
      }
    `
  ]
})
export class ProjectModalComponent implements OnInit, OnDestroy {
  @Input() public project!: Project;
  @Output() public modalClose = new EventEmitter<void>();

  public currentImageIndex = 0;
  public isOpening = false;
  public isMobileViewport = false;

  public readonly XIcon = X;
  public readonly ChevronLeftIcon = ChevronLeft;
  public readonly ChevronRightIcon = ChevronRight;
  public readonly ExternalLinkIcon = ExternalLink;
  public readonly GithubIcon = Github;
  public readonly Code2Icon = Code2;

  public ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.isMobileViewport = window.innerWidth < MOBILE_BREAKPOINT_PX;
    setTimeout(() => (this.isOpening = true), 10);
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
