import { Component, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NavigationComponent } from './shared/components/navigation/navigation.component';

@Component({
  imports: [RouterModule, NavigationComponent],
  selector: 'app-root',
  template: `
    <app-navigation></app-navigation>
    <main #mainContent class="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <router-outlet></router-outlet>
    </main>
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
