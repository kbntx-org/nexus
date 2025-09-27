import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Github, Linkedin } from 'lucide-angular';

import { LineBreakPipe } from '../../shared/pipes/nl2br.pipe';
import { SkillsComponent } from './components/skills/skills.component';
import { HERO_DATA } from './data/home.data';

@Component({
  selector: 'app-home',
  imports: [SkillsComponent, LineBreakPipe, LucideAngularModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  public heroData = HERO_DATA;
  private router = inject(Router);

  // Lucide icons
  public readonly GithubIcon = Github;
  public readonly LinkedinIcon = Linkedin;

  public navigateToExperiences(): void {
    this.router.navigate(['/experiences']);
  }
}
