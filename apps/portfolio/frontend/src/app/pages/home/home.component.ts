import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { SkillsComponent } from '../../shared/components/skills/skills.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LineBreakPipe } from '../../shared/pipes/nl2br.pipe';
import { HERO_DATA } from './data/home.data';

// Skills functionality is now handled by the SkillsComponent

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SkillsComponent, ThemeToggleComponent, LineBreakPipe],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  // Hero section data from external file
  public heroData = HERO_DATA;

  constructor(private router: Router) {}

  // Skills functionality is now handled by the SkillsComponent

  public navigateToExperiences(): void {
    this.router.navigate(['/experiences']);
  }
}
