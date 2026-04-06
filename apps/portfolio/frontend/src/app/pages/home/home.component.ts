import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Github, Linkedin } from 'lucide-angular';

import { SkillsComponent } from './components/skills/skills.component';
import { HERO_DATA } from './data/home.data';

@Component({
  selector: 'app-home',
  imports: [SkillsComponent, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  public readonly heroData = HERO_DATA;
  private readonly router = inject(Router);

  public readonly GithubIcon = Github;
  public readonly LinkedinIcon = Linkedin;

  public navigateToExperiences(): void {
    this.router.navigate(['/experiences']);
  }
}
