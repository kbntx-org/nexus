import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  navigationItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/experiences', label: 'Experiences', icon: '💼' }
    // { path: '/projects', label: 'Projects', icon: '🚀' },
    // { path: '/cv', label: 'CV', icon: '📄' }
  ];
}
