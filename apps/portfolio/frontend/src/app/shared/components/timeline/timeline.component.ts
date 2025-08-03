import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

export interface TimelineItem {
  company: string;
  title: string;
  contractType: string;
  location: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <div class="timeline-line">
        <div
          class="timeline-dot"
          *ngFor="let item of items; let i = index"
          [style.top]="i * 120 + 'px'"
        ></div>
      </div>

      <div class="timeline-content">
        <div
          class="timeline-card"
          *ngFor="let item of items; let i = index"
          [class.left]="i % 2 === 0"
          [class.right]="i % 2 === 1"
          [class.animate]="true"
          [style.animation-delay]="i * 0.3 + 's'"
          [style.top]="i * 120 + 'px'"
          (click)="openDetails(item)"
        >
          <div class="card-header">
            <h4 class="card-title">{{ item.title }}</h4>
            <span class="card-company">{{ item.company }}</span>
          </div>

          <div class="card-date">
            {{ item.startDate }}{{ item.endDate ? ' - ' + item.endDate : '' }}
          </div>

          <div class="card-location">
            {{ item.location }}
          </div>

          <div class="card-tags">
            <span class="tag">{{ item.contractType }}</span>
            <span class="tag">Full Stack</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dialog-overlay" *ngIf="showDialog" (click)="closeDetails()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <button class="dialog-close" (click)="closeDetails()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="dialog-header">
          <h3 class="dialog-title">{{ selectedItem?.title }}</h3>
          <p class="dialog-company">{{ selectedItem?.company }}</p>
        </div>

        <div class="dialog-body">
          <div class="dialog-meta">
            <div class="meta-item">
              <span class="meta-label">Contract:</span>
              <span class="meta-value">{{ selectedItem?.contractType }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Location:</span>
              <span class="meta-value">{{ selectedItem?.location }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Duration:</span>
              <span class="meta-value">
                {{ selectedItem?.startDate
                }}{{ selectedItem?.endDate ? ' - ' + selectedItem?.endDate : ' - Present' }}
              </span>
            </div>
          </div>

          <div class="dialog-description" *ngIf="selectedItem?.description">
            <h4>Description</h4>
            <p>{{ selectedItem?.description }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .timeline-container {
        position: relative;
        width: 100%;
        padding: 2rem 0;
        min-height: 600px;
      }

      .timeline-line {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        background: hsl(var(--muted-foreground));
        transform: translateX(-50%);
      }

      .timeline-content {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .timeline-card {
        position: absolute;
        width: 300px;
        background: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);

        &:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.15);
          border-color: hsl(var(--primary) / 0.3);
        }

        &.animate {
          animation: slideIn 0.6s ease-out forwards;
        }

        &.left {
          left: 0;
          transform: translateX(-320px);
        }

        &.right {
          right: 0;
          transform: translateX(20px);
        }
      }

      .timeline-dot {
        position: absolute;
        left: 50%;
        width: 12px;
        height: 12px;
        background: hsl(var(--primary));
        border: 2px solid hsl(var(--background));
        border-radius: 50%;
        transform: translateX(-50%);
        z-index: 2;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .card-header {
        margin-bottom: 1rem;
      }

      .card-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: hsl(var(--foreground));
        margin: 0 0 0.5rem 0;
        line-height: 1.3;
      }

      .card-company {
        font-size: 0.875rem;
        color: hsl(var(--primary));
        font-weight: 500;
      }

      .card-date {
        font-size: 0.875rem;
        color: hsl(var(--muted-foreground));
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      .card-location {
        font-size: 0.875rem;
        color: hsl(var(--muted-foreground));
        font-weight: 500;
        margin-bottom: 1rem;
      }

      .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .tag {
        background: hsl(var(--secondary));
        color: hsl(var(--secondary-foreground));
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      /* Dialog Styles */
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }

      .dialog-content {
        background: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
        max-width: 500px;
        width: 100%;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .dialog-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: hsl(var(--foreground));
        transition: all 0.2s ease;

        &:hover {
          background: hsl(var(--accent));
          transform: scale(1.1);
        }
      }

      .dialog-header {
        padding: 1.5rem 1.5rem 1rem;
        border-bottom: 1px solid hsl(var(--border));
      }

      .dialog-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: hsl(var(--foreground));
      }

      .dialog-company {
        color: hsl(var(--primary));
        font-weight: 500;
        margin: 0;
      }

      .dialog-body {
        padding: 1.5rem;
      }

      .dialog-meta {
        margin-bottom: 1.5rem;
      }

      .meta-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid hsl(var(--border) / 0.5);

        &:last-child {
          border-bottom: none;
        }
      }

      .meta-label {
        font-weight: 500;
        color: hsl(var(--muted-foreground));
        font-size: 0.875rem;
      }

      .meta-value {
        color: hsl(var(--foreground));
        font-weight: 500;
        font-size: 0.875rem;
      }

      .dialog-description {
        h4 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: hsl(var(--foreground));
        }

        p {
          color: hsl(var(--muted-foreground));
          line-height: 1.6;
          margin: 0;
          font-size: 0.875rem;
        }
      }

      @media (max-width: 768px) {
        .timeline-container {
          min-height: auto;
          padding: 1rem 0;
        }

        .timeline-line {
          display: none;
        }

        .timeline-content {
          height: auto;
        }

        .timeline-card {
          position: relative;
          left: auto;
          right: auto;
          transform: none;
          margin-bottom: 1.5rem;
          width: 100%;
          max-width: none;
          opacity: 1;
          padding: 1rem;
        }

        .timeline-card:hover {
          transform: scale(1.01);
        }

        .timeline-dot {
          display: none;
        }

        .card-title {
          font-size: 1rem;
        }

        .card-company {
          font-size: 0.8rem;
        }

        .card-date,
        .card-location {
          font-size: 0.75rem;
        }

        .tag {
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
        }

        .dialog-content {
          margin: 1rem;
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
        }

        .dialog-header,
        .dialog-body {
          padding: 1rem;
        }

        .meta-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
      }

      @media (max-width: 480px) {
        .timeline-container {
          padding: 0.5rem 0;
        }

        .timeline-card {
          margin-bottom: 1rem;
          padding: 0.75rem;
        }

        .card-title {
          font-size: 0.9rem;
        }

        .card-company {
          font-size: 0.75rem;
        }

        .card-date,
        .card-location {
          font-size: 0.7rem;
        }

        .tag {
          font-size: 0.6rem;
          padding: 0.15rem 0.4rem;
        }

        .dialog-content {
          margin: 0.5rem;
        }

        .dialog-header,
        .dialog-body {
          padding: 0.75rem;
        }
      }
    `
  ]
})
export class TimelineComponent implements OnInit {
  @Input() public items: TimelineItem[] = [];

  public showDialog = false;
  public selectedItem: TimelineItem | null = null;

  public ngOnInit(): void {
    this.items.sort((a, b) => parseInt(a.startDate) - parseInt(b.startDate));
  }

  public openDetails(item: TimelineItem): void {
    this.selectedItem = item;
    this.showDialog = true;
  }

  public closeDetails(): void {
    this.showDialog = false;
    this.selectedItem = null;
  }
}
