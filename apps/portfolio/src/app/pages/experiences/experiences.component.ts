import { Component } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';

import { EXPERIENCES, Experience } from './data/experiences.data';

@Component({
  selector: 'app-experiences',
  imports: [LucideAngularModule],
  template: `
    <div class="bg-background py-8 text-foreground md:py-12">
      <div class="mx-auto max-w-6xl px-4">
        <div
          class="animate-slide-in-up opacity-0 will-change-transform"
          style="animation-delay: 0.1s; animation-fill-mode: forwards;"
        >
          <h1 class="mb-4 text-center text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
            My Experiences
          </h1>
          <p class="mb-12 text-center text-lg text-muted-foreground sm:text-xl">
            My professional journey and career progression
          </p>
        </div>

        <div class="relative">
          <div
            class="absolute bottom-0 left-4 top-8 w-0.5 -translate-x-1/2 transform animate-fade-in bg-gradient-to-b from-[#667eea] to-[#764ba2] opacity-0 md:left-1/2"
            style="animation-delay: 1.2s; animation-fill-mode: forwards;"
          ></div>

          <div class="space-y-12">
            @for (experience of experiences; track experience; let i = $index) {
              <div class="relative">
                <div
                  class="relative z-10 mb-8 animate-slide-in-up rounded-lg border border-border bg-card p-6 opacity-0 shadow-lg md:p-8"
                  [style.animation-delay]="0.5 + i * 0.1 + 's'"
                  style="animation-fill-mode: forwards;"
                >
                  <div class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 class="mb-2 text-2xl font-bold text-foreground md:text-3xl">
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
                    <p class="leading-relaxed text-muted-foreground">
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
                            <h3 class="text-xl font-semibold text-foreground">{{ role.title }}</h3>
                            <span class="mt-1 block text-sm text-muted-foreground">{{
                              role.duration
                            }}</span>
                          </div>
                          <button
                            (click)="toggleRole(i, j)"
                            class="mt-2 flex items-center gap-2 text-[#667eea] transition-colors duration-200 md:mt-0"
                          >
                            <span class="text-sm font-medium">
                              {{ isRoleExpanded(i, j) ? 'Show Less' : 'Show Details' }}
                            </span>
                            <lucide-angular
                              [img]="ChevronDownIcon"
                              class="h-4 w-4 transition-transform duration-200"
                              [class.rotate-180]="isRoleExpanded(i, j)"
                            ></lucide-angular>
                          </button>
                        </div>
                        @if (isRoleExpanded(i, j)) {
                          <div class="space-y-6 pb-4">
                            <div>
                              <h4 class="mb-3 text-lg font-medium text-foreground">
                                Key Responsibilities
                              </h4>
                              <ul class="space-y-2">
                                @for (
                                  responsibility of role.responsibilities;
                                  track responsibility
                                ) {
                                  <li class="flex items-start gap-3 text-muted-foreground">
                                    <span
                                      class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#667eea]"
                                    ></span>
                                    <span>{{ responsibility }}</span>
                                  </li>
                                }
                              </ul>
                            </div>
                            <div>
                              <h4 class="mb-3 text-lg font-medium text-foreground">
                                Major Achievements
                              </h4>
                              <ul class="space-y-2">
                                @for (achievement of role.achievements; track achievement) {
                                  <li class="flex items-start gap-3 text-muted-foreground">
                                    <span
                                      class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#764ba2]"
                                    ></span>
                                    <span>{{ achievement }}</span>
                                  </li>
                                }
                              </ul>
                            </div>
                            <div>
                              <h4 class="mb-3 text-lg font-medium text-foreground">
                                Technologies Used
                              </h4>
                              <div class="flex flex-wrap items-center gap-2">
                                @for (
                                  tech of isTechExpanded(i, j)
                                    ? role.technologies
                                    : role.technologies.slice(0, 6);
                                  track tech
                                ) {
                                  <span
                                    class="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                                  >
                                    {{ tech }}
                                  </span>
                                }
                                @if (role.technologies.length > 6) {
                                  <button
                                    (click)="toggleTech(i, j)"
                                    class="rounded-full border border-[#667eea] px-3 py-1 text-sm font-medium text-[#667eea] transition-colors hover:bg-[#667eea]/10"
                                  >
                                    {{
                                      isTechExpanded(i, j)
                                        ? 'Show less'
                                        : '+' + (role.technologies.length - 6) + ' more'
                                    }}
                                  </button>
                                }
                              </div>
                            </div>
                          </div>
                        }
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
  public expandedTech: Set<string> = new Set();

  public readonly ChevronDownIcon = ChevronDown;

  public toggleRole(i: number, j: number): void {
    const key = `${i}-${j}`;
    this.expandedRoles.has(key) ? this.expandedRoles.delete(key) : this.expandedRoles.add(key);
  }

  public isRoleExpanded(i: number, j: number): boolean {
    return this.expandedRoles.has(`${i}-${j}`);
  }

  public toggleTech(i: number, j: number): void {
    const key = `${i}-${j}`;
    this.expandedTech.has(key) ? this.expandedTech.delete(key) : this.expandedTech.add(key);
  }

  public isTechExpanded(i: number, j: number): boolean {
    return this.expandedTech.has(`${i}-${j}`);
  }
}
