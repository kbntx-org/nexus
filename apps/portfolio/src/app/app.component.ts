import { Component, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NavigationComponent } from './shared/components/navigation/navigation.component';

@Component({
  imports: [RouterModule, NavigationComponent],
  selector: 'app-root',
  template: `
    <div class="night-background"></div>
    <app-navigation></app-navigation>
    <main #mainContent class="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: `
    .night-background {
      position: fixed;
      inset: 0;
      z-index: 0;
      background-image: url('/assets/images/lofi-kenny.webp');
      background-size: cover;
      background-position: bottom;
      pointer-events: none;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(10, 14, 39, 0.45) 0%,
          rgba(10, 14, 39, 0.3) 40%,
          rgba(10, 14, 39, 0.5) 100%
        );
      }

      @media (max-width: 768px) {
        background-image: url('/assets/images/lofi-kenny-vertical.webp');
      }
    }
  `
})
export class AppComponent implements OnDestroy, AfterViewInit {
  @ViewChild('mainContent') public mainContent!: ElementRef<HTMLElement>;
  private routerSubscription?: Subscription;
  private router = inject(Router);

  public ngAfterViewInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.mainContent?.nativeElement) {
          this.mainContent.nativeElement.scrollTo(0, 0);
        }
      });
  }

  public ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
