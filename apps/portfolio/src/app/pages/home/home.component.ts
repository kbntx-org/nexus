import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Github, Linkedin } from 'lucide-angular';

import { SkillsComponent } from './components/skills/skills.component';
import { HomeService } from './services/home.service';

@Component({
  selector: 'app-home',
  imports: [SkillsComponent, LucideAngularModule],
  providers: [HomeService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly router = inject(Router);
  public readonly homeService = inject(HomeService);

  public readonly GithubIcon = Github;
  public readonly LinkedinIcon = Linkedin;

  public navigateToExperiences(): void {
    this.router.navigate(['/experiences']);
  }
}
