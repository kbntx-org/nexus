import { Component } from '@angular/core';

@Component({
  selector: 'app-cv',
  imports: [],
  template: `
    <div class="bg-background text-foreground py-8 md:py-12">
      <div class="mx-auto max-w-6xl px-4">
        <div
          class="animate-slide-in-up opacity-0 will-change-transform"
          style="animation-delay: 0.1s; animation-fill-mode: forwards;"
        >
          <h1 class="text-foreground mb-4 text-center text-4xl font-bold sm:text-5xl lg:text-6xl">
            Curriculum Vitae
          </h1>
          <p class="text-muted-foreground mb-12 text-center text-lg sm:text-xl">
            My professional background and qualifications
          </p>
        </div>

        <div
          class="animate-slide-in-up mx-auto h-[400px] max-w-4xl opacity-0 sm:h-[500px] md:h-[calc(100vh-200px)]"
          style="animation-delay: 0.3s; animation-fill-mode: forwards;"
        >
          <div
            class="bg-card md:border-border group relative h-full overflow-hidden rounded-lg border-0 shadow-lg md:border"
          >
            <div class="relative h-full">
              <div
                class="absolute inset-0 transition-opacity duration-500"
                [class.opacity-100]="currentPage === 0"
                [class.opacity-0]="currentPage !== 0"
              >
                <img
                  src="assets/images/cv-kenny-page-1.png"
                  alt="CV Page 1"
                  class="h-full w-full object-contain"
                />
              </div>

              <div
                class="absolute inset-0 transition-opacity duration-500"
                [class.opacity-100]="currentPage === 1"
                [class.opacity-0]="currentPage !== 1"
              >
                <img
                  src="assets/images/cv-kenny-page-2.png"
                  alt="CV Page 2"
                  class="h-full w-full object-contain"
                />
              </div>
            </div>

            <div
              class="bg-card/80 border-border animate-fade-in absolute bottom-4 left-1/2 z-10 flex hidden -translate-x-1/2 transform items-center gap-4 rounded-full border px-4 py-2 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 md:flex"
              style="animation-delay: 0.6s; animation-fill-mode: forwards;"
            >
              <button
                (click)="previousPage()"
                [disabled]="currentPage === 0"
                class="hover:bg-muted rounded-full p-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
              </button>

              <div class="flex gap-2">
                <button
                  (click)="goToPage(0)"
                  class="h-3 w-3 rounded-full transition-colors duration-200"
                  [class.bg-primary]="currentPage === 0"
                  [class.bg-muted]="currentPage !== 0"
                ></button>
                <button
                  (click)="goToPage(1)"
                  class="h-3 w-3 rounded-full transition-colors duration-200"
                  [class.bg-primary]="currentPage === 1"
                  [class.bg-muted]="currentPage !== 1"
                ></button>
              </div>

              <button
                (click)="nextPage()"
                [disabled]="currentPage === 1"
                class="hover:bg-muted rounded-full p-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          class="animate-slide-in-up mt-6 flex flex-col items-center gap-4 opacity-0 md:hidden"
          style="animation-delay: 0.5s; animation-fill-mode: forwards;"
        >
          <div
            class="bg-card/60 border-border flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-sm"
          >
            <button
              (click)="previousPage()"
              [disabled]="currentPage === 0"
              class="hover:bg-muted rounded-full p-1.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </button>

            <div class="flex gap-2">
              <button
                (click)="goToPage(0)"
                class="h-2.5 w-2.5 rounded-full transition-colors duration-200"
                [class.bg-primary]="currentPage === 0"
                [class.bg-muted]="currentPage !== 0"
              ></button>
              <button
                (click)="goToPage(1)"
                class="h-2.5 w-2.5 rounded-full transition-colors duration-200"
                [class.bg-primary]="currentPage === 1"
                [class.bg-muted]="currentPage !== 1"
              ></button>
            </div>

            <button
              (click)="nextPage()"
              [disabled]="currentPage === 1"
              class="hover:bg-muted rounded-full p-1.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Download CV Button - Both Desktop and Mobile -->
        <div
          class="animate-slide-in-up mt-8 flex flex-col items-center gap-4 opacity-0"
          style="animation-delay: 0.7s; animation-fill-mode: forwards;"
        >
          <a
            href="assets/documents/cv-kenny-talbi.pdf"
            download="cv-kenny-talbi.pdf"
            class="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-6 py-3 text-base font-medium shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Download CV
          </a>
        </div>
      </div>
    </div>
  `
})
export class CvComponent {
  public currentPage = 0;

  public nextPage(): void {
    if (this.currentPage < 1) {
      this.currentPage++;
    }
  }

  public previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  public goToPage(page: number): void {
    this.currentPage = page;
  }
}
