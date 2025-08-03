import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';

import { SKILLS, Skill } from '../../../pages/skills/data/skills.data';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: HTMLElement;
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
    template: `
    <section class="relative py-12 md:py-8" #skillsSection>
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12 relative animate-slide-in-up">
          Skills & Technologies
          <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full"></div>
        </h2>

        <div class="skills-particles relative w-full h-[300px] md:h-[400px] max-w-full overflow-visible animate-slide-in-up" style="animation-delay: 0.2s">
          <div
            class="particle absolute flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-card/60 backdrop-blur-sm border border-border/40 rounded-full shadow-lg transition-all duration-300 cursor-pointer opacity-90 hover:scale-130 hover:opacity-100 hover:bg-card/80 hover:border-primary/50 hover:shadow-xl hover:z-10"
            *ngFor="let skill of skills; let i = index"
            [style.animation-delay]="i * 0.5 + 's'"
            [style.animation-duration]="8 + i * 2 + 's'"
          >
            <img
              [src]="getIconUrl(skill)"
              [alt]="skill.simpleIconName || 'Technology icon'"
              class="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-120"
            />
          </div>
        </div>
      </div>
    </section>
  `
})
export class SkillsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('skillsSection') public skillsSection!: ElementRef;

  public skills: Skill[] = SKILLS;

  private particles: Particle[] = [];
  private animationId: number | null = null;


  public ngAfterViewInit(): void {
    this.setupScrollAnimations();
    this.setupParticlePhysics();
  }

  public ngOnDestroy(): void {
    this.stopParticleAnimation();
  }

  public setupScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          if (entry.target === this.skillsSection?.nativeElement) {
            this.startParticleAnimation();
          }
        } else {
          if (entry.target === this.skillsSection?.nativeElement) {
            this.stopParticleAnimation();
          }
        }
      });
    }, observerOptions);

    if (this.skillsSection) {
      observer.observe(this.skillsSection.nativeElement);
    }
  }

  public setupParticlePhysics(): void {
    if (!this.skillsSection) {return;}

    const container = this.skillsSection.nativeElement.querySelector('.skills-particles');
    if (!container) {return;}

    const particleElements = container.querySelectorAll('.particle');
    const containerRect = container.getBoundingClientRect();
    const particleSize = window.innerWidth < 768 ? 40 : 48;

    particleElements.forEach((element: HTMLElement, index: number) => {
      const x = Math.random() * (containerRect.width - particleSize);
      const y = Math.random() * (containerRect.height - particleSize);

      const vx = (Math.random() - 0.5) * 1.5;
      const vy = (Math.random() - 0.5) * 1.5;

      this.particles.push({
        x,
        y,
        vx,
        vy,
        element
      });

      element.style.left = x + 'px';
      element.style.top = y + 'px';
    });
  }

  public startParticleAnimation(): void {
    if (this.animationId) {return;}
    this.animateParticles();
  }

  public stopParticleAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public animateParticles(): void {
    if (!this.skillsSection) {return;}

    const container = this.skillsSection.nativeElement.querySelector('.skills-particles');
    if (!container) {return;}

    const containerRect = container.getBoundingClientRect();
    const particleSize = window.innerWidth < 768 ? 40 : 48;

    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x <= 0 || particle.x >= containerRect.width - particleSize) {
        particle.vx = -particle.vx;
        particle.x = Math.max(0, Math.min(particle.x, containerRect.width - particleSize));
      }

      if (particle.y <= 0 || particle.y >= containerRect.height - particleSize) {
        particle.vy = -particle.vy;
        particle.y = Math.max(0, Math.min(particle.y, containerRect.height - particleSize));
      }

      particle.element.style.left = particle.x + 'px';
      particle.element.style.top = particle.y + 'px';
    });

    this.animationId = requestAnimationFrame(() => this.animateParticles());
  }

  public getIconUrl(skill: Skill): string {
    if (skill.customUrl) {
      return skill.customUrl;
    }

    if (skill.simpleIconName) {
      const baseUrl = 'https://cdn.simpleicons.org';
      if (skill.color) {
        return `${baseUrl}/${skill.simpleIconName}/${skill.color}`;
      }
      return `${baseUrl}/${skill.simpleIconName}`;
    }

    return '';
  }
}
