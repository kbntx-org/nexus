import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    console.log('Initializing theme:', { savedTheme, prefersDark, theme });
    this.setTheme(theme);
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  setTheme(theme: Theme): void {
    console.log('Setting theme to:', theme);
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to document');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from document');
    }

    // Verify the class was added/removed
    console.log('Document classes:', document.documentElement.classList.toString());
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('Toggling theme from', currentTheme, 'to', newTheme);
    this.setTheme(newTheme);
  }
}
