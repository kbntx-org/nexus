import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { EXPERIENCES, Experience } from './data/experiences.data';

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-background text-foreground py-8 md:py-12">
      <div class="max-w-6xl mx-auto px-4">
        <div class="animate-slide-in-up">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-foreground mb-4">My Experience</h1>
          <p class="text-lg sm:text-xl text-muted-foreground text-center mb-12">My professional journey and career progression</p>
        </div>

        <!-- Timeline Section -->
        <div class="relative">
          <!-- Timeline Line -->
          <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#667eea] to-[#764ba2] transform -translate-x-1/2"></div>

          <!-- Experiences -->
          <div class="space-y-12">
            <div
              *ngFor="let experience of experiences; let i = index"
              class="relative animate-slide-in-up"
              [style.animation-delay]="(i * 0.2) + 's'"
            >
              <!-- Company Card -->
              <div class="relative z-10 bg-card border border-border rounded-lg shadow-lg p-6 md:p-8 mb-8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 class="text-2xl md:text-3xl font-bold text-foreground mb-2">{{ experience.company }}</h2>
                    <p class="text-muted-foreground">{{ experience.location }}</p>
                  </div>
                  <div class="mt-4 md:mt-0">
                    <span class="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-4 py-2 rounded-full text-sm font-medium">
                      {{ experience.duration }}
                    </span>
                  </div>
                </div>

                <!-- Company Description -->
                <div class="mb-6">
                  <p class="text-muted-foreground leading-relaxed">{{ experience.description }}</p>
                </div>

                <!-- Roles -->
                <div class="space-y-4">
                  <div
                    *ngFor="let role of experience.roles; let j = index"
                    class="border-l-4 border-[#667eea] pl-6"
                  >
                    <!-- Role Header (Always Visible) -->
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div class="flex-1">
                        <h3 class="text-xl font-semibold text-foreground">{{ role.title }}</h3>
                        <span class="text-muted-foreground text-sm mt-1 block">{{ role.duration }}</span>
                      </div>
                      <button
                        (click)="toggleRole(i, j)"
                        class="flex items-center gap-2 text-[#667eea] hover:text-[#764ba2] transition-colors duration-200 mt-2 md:mt-0"
                      >
                        <span class="text-sm font-medium">
                          {{ isRoleExpanded(i, j) ? 'Show Less' : 'Show Details' }}
                        </span>
                        <svg
                          class="w-4 h-4 transition-transform duration-200"
                          [class.rotate-180]="isRoleExpanded(i, j)"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                    </div>

                    <!-- Collapsible Content -->
                    <div
                      class="overflow-hidden transition-all duration-300 ease-in-out"
                      [class.max-h-0]="!isRoleExpanded(i, j)"
                      [class.max-h-[1000px]]="isRoleExpanded(i, j)"
                    >
                      <div class="space-y-6 pb-4">
                        <!-- Responsibilities -->
                        <div>
                          <h4 class="text-lg font-medium text-foreground mb-3">Key Responsibilities</h4>
                          <ul class="space-y-2">
                            <li
                              *ngFor="let responsibility of role.responsibilities"
                              class="flex items-start gap-3 text-muted-foreground"
                            >
                              <span class="w-2 h-2 bg-[#667eea] rounded-full mt-2 flex-shrink-0"></span>
                              <span>{{ responsibility }}</span>
                            </li>
                          </ul>
                        </div>

                        <!-- Achievements -->
                        <div>
                          <h4 class="text-lg font-medium text-foreground mb-3">Major Achievements</h4>
                          <ul class="space-y-2">
                            <li
                              *ngFor="let achievement of role.achievements"
                              class="flex items-start gap-3 text-muted-foreground"
                            >
                              <span class="w-2 h-2 bg-[#764ba2] rounded-full mt-2 flex-shrink-0"></span>
                              <span>{{ achievement }}</span>
                            </li>
                          </ul>
                        </div>

                        <!-- Technologies -->
                        <div>
                          <h4 class="text-lg font-medium text-foreground mb-3">Technologies Used</h4>
                          <div class="flex flex-wrap gap-2">
                            <span
                              *ngFor="let tech of role.technologies"
                              class="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {{ tech }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExperiencesComponent {
  public experiences: Experience[] = EXPERIENCES;
  public expandedRoles: Set<string> = new Set();

  public toggleRole(experienceIndex: number, roleIndex: number): void {
    const key = `${experienceIndex}-${roleIndex}`;
    if (this.expandedRoles.has(key)) {
      this.expandedRoles.delete(key);
    } else {
      this.expandedRoles.add(key);
    }
  }

  public isRoleExpanded(experienceIndex: number, roleIndex: number): boolean {
    return this.expandedRoles.has(`${experienceIndex}-${roleIndex}`);
  }
}
