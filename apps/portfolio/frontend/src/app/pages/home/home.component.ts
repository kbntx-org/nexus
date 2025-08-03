import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { SkillsComponent } from '../../shared/components/skills/skills.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LineBreakPipe } from '../../shared/pipes/nl2br.pipe';
import { HERO_DATA } from './data/home.data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SkillsComponent, ThemeToggleComponent, LineBreakPipe],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  public heroData = HERO_DATA;

  constructor(private router: Router) {}

  public navigateToExperiences(): void {
    this.router.navigate(['/experiences']);
  }
}
