import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html'
})
export class SkillsComponent implements OnInit, AfterViewInit {
  @ViewChild('skillsSection') skillsSection!: ElementRef;

  skills = [
    { name: 'Angular', level: 90 },
    { name: 'React', level: 85 },
    { name: 'TypeScript', level: 88 },
    { name: 'Node.js', level: 82 },
    { name: 'Python', level: 75 },
    { name: 'Docker', level: 70 }
  ];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
  }

  setupScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (this.skillsSection) {
      observer.observe(this.skillsSection.nativeElement);
    }
  }

  getSkillIcon(skillName: string): string {
    const icons: { [key: string]: string } = {
      Angular: '⚡',
      React: '⚛️',
      TypeScript: '📘',
      'Node.js': '🟢',
      Python: '🐍',
      Docker: '🐳'
    };
    return icons[skillName] || '💻';
  }

  getSkillIconClass(skillName: string): string {
    return skillName.toLowerCase().replace(/[^a-z]/g, '');
  }
}
