import { Component } from '@angular/core';

import { EXPERIENCES, Experience } from './data/experiences.data';

@Component({
  selector: 'app-experiences',
  template: `
    <div class="bg-background text-foreground py-8 md:py-12">
      <div class="mx-auto max-w-6xl px-4">
        <div
          class="animate-slide-in-up opacity-0 will-change-transform"
          style="animation-delay: 0.1s; animation-fill-mode: forwards;"
        >
          <h1 class="text-foreground mb-4 text-center text-4xl font-bold sm:text-5xl lg:text-6xl">
            My Experience
          </h1>
          <p class="text-muted-foreground mb-12 text-center text-lg sm:text-xl">
            My professional journey and career progression
          </p>
        </div>

        <div class="relative">
          <div
            class="animate-fade-in absolute bottom-0 left-4 top-8 w-0.5 -translate-x-1/2 transform bg-gradient-to-b from-[#667eea] to-[#764ba2] opacity-0 md:left-1/2"
            style="animation-delay: 1.2s; animation-fill-mode: forwards;"
          ></div>

          <div class="space-y-12">
            @for (experience of experiences; track experience; let i = $index) {
              <div class="relative">
                <div
                  class="bg-card border-border animate-slide-in-up relative z-10 mb-8 rounded-lg border p-6 opacity-0 shadow-lg md:p-8"
                  [style.animation-delay]="0.5 + i * 0.1 + 's'"
                  style="animation-fill-mode: forwards;"
                >
                  <div class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 class="text-foreground mb-2 text-2xl font-bold md:text-3xl">
                        {{ experience.company }}
                      </h2>
                      <p class="text-muted-foreground">{{ experience.location }}</p>
                    </div>
                    <div class="mt-4 md:mt-0">
                      <span
                        class="rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-2 text-sm font-medium text-white"
                      >
                        {{ experience.duration }}
                      </span>
                    </div>
                  </div>
                  <div class="mb-6">
                    <p class="text-muted-foreground leading-relaxed">
                      {{ experience.description }}
                    </p>
                  </div>
                  <div class="space-y-4">
                    @for (role of experience.roles; track role; let j = $index) {
                      <div class="border-l-4 border-[#667eea] pl-6">
                        <div
                          class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between"
                        >
                          <div class="flex-1">
                            <h3 class="text-foreground text-xl font-semibold">{{ role.title }}</h3>
                            <span class="text-muted-foreground mt-1 block text-sm">{{
                              role.duration
                            }}</span>
                          </div>
                          <button
                            (click)="toggleRole(i, j)"
                            class="mt-2 flex items-center gap-2 text-[#667eea] transition-colors duration-200 hover:text-[#764ba2] md:mt-0"
                          >
                            <span class="text-sm font-medium">
                              {{ isRoleExpanded(i, j) ? 'Show Less' : 'Show Details' }}
                            </span>
                            <svg
                              class="h-4 w-4 transition-transform duration-200"
                              [class.rotate-180]="isRoleExpanded(i, j)"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </button>
                        </div>
                        <div
                          class="overflow-hidden transition-all duration-300 ease-in-out"
                          [class.max-h-0]="!isRoleExpanded(i, j)"
                          [class.max-h-[1000px]]="isRoleExpanded(i, j)"
                        >
                          <div class="space-y-6 pb-4">
                            <div>
                              <h4 class="text-foreground mb-3 text-lg font-medium">
                                Key Responsibilities
                              </h4>
                              <ul class="space-y-2">
                                @for (
                                  responsibility of role.responsibilities;
                                  track responsibility
                                ) {
                                  <li class="text-muted-foreground flex items-start gap-3">
                                    <span
                                      class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#667eea]"
                                    ></span>
                                    <span>{{ responsibility }}</span>
                                  </li>
                                }
                              </ul>
                            </div>
                            <div>
                              <h4 class="text-foreground mb-3 text-lg font-medium">
                                Major Achievements
                              </h4>
                              <ul class="space-y-2">
                                @for (achievement of role.achievements; track achievement) {
                                  <li class="text-muted-foreground flex items-start gap-3">
                                    <span
                                      class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#764ba2]"
                                    ></span>
                                    <span>{{ achievement }}</span>
                                  </li>
                                }
                              </ul>
                            </div>
                            <div>
                              <h4 class="text-foreground mb-3 text-lg font-medium">
                                Technologies Used
                              </h4>
                              <div class="flex flex-wrap gap-2">
                                @for (tech of role.technologies; track tech) {
                                  <span
                                    class="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm font-medium"
                                  >
                                    {{ tech }}
                                  </span>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
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
