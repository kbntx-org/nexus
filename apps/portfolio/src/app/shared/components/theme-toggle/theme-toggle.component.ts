import { Component, inject } from '@angular/core';
import { LucideAngularModule, Moon, Sun } from 'lucide-angular';

import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [LucideAngularModule],
  template: `
    <button
      class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-foreground transition-all duration-200 hover:scale-105 hover:bg-accent active:scale-95"
      (click)="themeService.toggleTheme()"
      [attr.aria-label]="
        'Switch to ' + (themeService.theme() === 'light' ? 'dark' : 'light') + ' mode'
      "
    >
      @if (themeService.theme() === 'light') {
        <lucide-angular
          [img]="MoonIcon"
          class="h-5 w-5 transition-transform duration-300"
        ></lucide-angular>
      }
      @if (themeService.theme() === 'dark') {
        <lucide-angular
          [img]="SunIcon"
          class="h-5 w-5 transition-transform duration-300"
        ></lucide-angular>
      }
    </button>
  `
})
export class ThemeToggleComponent {
  public themeService = inject(ThemeService);

  // Lucide icons
  public readonly MoonIcon = Moon;
  public readonly SunIcon = Sun;
}
