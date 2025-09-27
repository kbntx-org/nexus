import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Briefcase,
  Rocket,
  FileText,
  Laptop,
  X,
  Menu
} from 'lucide-angular';

import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule, ThemeToggleComponent, LucideAngularModule],
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  public navigationItems = [
    { path: '/home', label: 'Home', icon: 'HomeIcon' },
    { path: '/experiences', label: 'Experiences', icon: 'BriefcaseIcon' },
    { path: '/projects', label: 'Projects', icon: 'RocketIcon' },
    { path: '/cv', label: 'CV', icon: 'FileTextIcon' }
  ];

  public isMenuOpen = false;

  // Lucide icons
  public readonly HomeIcon = Home;
  public readonly BriefcaseIcon = Briefcase;
  public readonly RocketIcon = Rocket;
  public readonly FileTextIcon = FileText;
  public readonly LaptopIcon = Laptop;
  public readonly XIcon = X;
  public readonly MenuIcon = Menu;

  public toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu(): void {
    this.isMenuOpen = false;
  }
}
