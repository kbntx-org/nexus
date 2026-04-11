import { Component } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';

import { EXPERIENCES, Experience } from './data/experiences.data';

const VISIBLE_TECH_COUNT = 6;

@Component({
  selector: 'app-experiences',
  imports: [LucideAngularModule],
  templateUrl: './experiences.component.html'
})
export class ExperiencesComponent {
  public readonly experiences: Experience[] = EXPERIENCES;
  public readonly ChevronDownIcon = ChevronDown;
  public readonly visibleTechCount = VISIBLE_TECH_COUNT;

  private readonly expandedRoles = new Set<string>();
  private readonly expandedTech = new Set<string>();

  public toggleRole(experienceIndex: number, roleIndex: number): void {
    this.toggle(this.expandedRoles, experienceIndex, roleIndex);
  }

  public isRoleExpanded(experienceIndex: number, roleIndex: number): boolean {
    return this.expandedRoles.has(this.key(experienceIndex, roleIndex));
  }

  public toggleTech(experienceIndex: number, roleIndex: number): void {
    this.toggle(this.expandedTech, experienceIndex, roleIndex);
  }

  public isTechExpanded(experienceIndex: number, roleIndex: number): boolean {
    return this.expandedTech.has(this.key(experienceIndex, roleIndex));
  }

  private toggle(target: Set<string>, experienceIndex: number, roleIndex: number): void {
    const key = this.key(experienceIndex, roleIndex);
    if (target.has(key)) {
      target.delete(key);
    } else {
      target.add(key);
    }
  }

  private key(experienceIndex: number, roleIndex: number): string {
    return `${experienceIndex}-${roleIndex}`;
  }
}
