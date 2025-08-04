import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule, ThemeToggleComponent],
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  public navigationItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/experiences', label: 'Experiences', icon: '💼' },
    { path: '/cv', label: 'CV', icon: '📄' }
  ];

  public isMenuOpen = false;

  public toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu(): void {
    this.isMenuOpen = false;
  }
}
