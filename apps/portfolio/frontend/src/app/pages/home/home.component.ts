import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { SkillsComponent } from '../../shared/components/skills/skills.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

// Skills functionality is now handled by the SkillsComponent

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SkillsComponent, ThemeToggleComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  // Hero section data
  public heroData = {
    name: 'Kenny',
    title: 'Full-Stack Developer',
    subtitle: 'Passionate about creating beautiful, functional web applications',
    description:
      "I'm a passionate full-stack developer with 5+ years of experience building modern web applications. I specialize in Angular, React, and Node.js, creating scalable solutions that deliver exceptional user experiences."
  };

  constructor(private router: Router) {}

  // Skills functionality is now handled by the SkillsComponent

  public navigateToExperiences(): void {
    this.router.navigate(['/experiences']);
  }
}
