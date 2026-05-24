import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';

import { SKILLS, Skill } from '../../data/skills.data';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: HTMLElement;
}

@Component({
  selector: 'app-skills',
  imports: [],
  template: `
    <section class="relative py-12 md:py-8" #skillsSection>
      <div class="mx-auto max-w-6xl px-4">
        <h2
          class="relative mb-12 animate-slide-in-up text-center text-3xl font-bold text-foreground sm:text-4xl"
        >
          Skills & Technologies
          <div
            class="absolute -bottom-3 left-1/2 h-1 w-16 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-night-purple to-night-purple-deep"
          ></div>
        </h2>

        <div
          class="skills-particles relative h-[300px] w-full max-w-full animate-slide-in-up overflow-visible md:h-[400px]"
          style="animation-delay: 0.2s"
        >
          @for (skill of skills; track skill; let i = $index) {
            <div
              class="particle hover:scale-130 absolute flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/40 bg-card/60 opacity-90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:z-10 hover:border-primary/50 hover:bg-card/80 hover:opacity-100 hover:shadow-xl md:h-12 md:w-12"
              [style.animation-delay]="i * 0.5 + 's'"
              [style.animation-duration]="8 + i * 2 + 's'"
            >
              <img
                [src]="getIconUrl(skill)"
                [alt]="skill.name"
                class="group-hover:scale-120 h-5 w-5 transition-transform duration-300 md:h-6 md:w-6"
              />
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class SkillsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('skillsSection') public skillsSection!: ElementRef;

  public skills: Skill[] = SKILLS;

  private readonly iconsBaseUrl = 'https://nexus-public-assets.kbntx.com/icons';
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
    if (!this.skillsSection) {
      return;
    }

    const container = this.skillsSection.nativeElement.querySelector('.skills-particles');
    if (!container) {
      return;
    }

    const particleElements = container.querySelectorAll('.particle');
    const containerRect = container.getBoundingClientRect();
    const particleSize = window.innerWidth < 768 ? 40 : 48;

    particleElements.forEach((element: HTMLElement) => {
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
    if (this.animationId) {
      return;
    }
    this.animateParticles();
  }

  public stopParticleAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public animateParticles(): void {
    if (!this.skillsSection) {
      return;
    }

    const container = this.skillsSection.nativeElement.querySelector('.skills-particles');
    if (!container) {
      return;
    }

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
    return `${this.iconsBaseUrl}/${skill.icon}`;
  }
}
