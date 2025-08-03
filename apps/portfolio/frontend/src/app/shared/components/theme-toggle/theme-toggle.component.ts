import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="w-10 h-10 bg-card border border-border rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 text-foreground hover:bg-accent hover:scale-105 active:scale-95"
      (click)="toggleTheme()"
      [attr.aria-label]="'Switch to ' + (currentTheme === 'light' ? 'dark' : 'light') + ' mode'"
    >
      <svg
        *ngIf="currentTheme === 'light'"
        class="w-5 h-5 transition-transform duration-300"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <svg
        *ngIf="currentTheme === 'dark'"
        class="w-5 h-5 transition-transform duration-300"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    </button>
  `
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  public currentTheme: Theme = 'light';
  private subscription: Subscription = new Subscription();

  constructor(private themeService: ThemeService) {}

  public ngOnInit(): void {
    this.subscription.add(
      this.themeService.theme$.subscribe(theme => {
        this.currentTheme = theme;
      })
    );
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
