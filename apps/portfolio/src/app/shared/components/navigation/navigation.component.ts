import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Briefcase,
  Rocket,
  Laptop,
  Github,
  Linkedin
} from 'lucide-angular';

@Component({
  selector: 'app-navigation',
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  public navigationItems = [
    { path: '/home', label: 'Home', icon: 'HomeIcon' },
    { path: '/experiences', label: 'Experiences', icon: 'BriefcaseIcon' },
    { path: '/projects', label: 'Projects', icon: 'RocketIcon' }
  ];

  // Lucide icons
  public readonly HomeIcon = Home;
  public readonly BriefcaseIcon = Briefcase;
  public readonly RocketIcon = Rocket;
  public readonly LaptopIcon = Laptop;
  public readonly GithubIcon = Github;
  public readonly LinkedinIcon = Linkedin;
}
