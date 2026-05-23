import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Briefcase, Rocket, Github, Linkedin } from 'lucide-angular';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  public navigationItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/experiences', label: 'Experiences', icon: Briefcase },
    { path: '/projects', label: 'Projects', icon: Rocket }
  ];

  public readonly GithubIcon = Github;
  public readonly LinkedinIcon = Linkedin;
}
