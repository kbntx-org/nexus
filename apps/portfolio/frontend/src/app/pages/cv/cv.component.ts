import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-background text-foreground py-8 md:py-12">
      <div class="max-w-6xl mx-auto px-4">
                <div class="animate-slide-in-up will-change-transform" style="animation-delay: 0.1s;">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-foreground mb-4">Curriculum Vitae</h1>
          <p class="text-lg sm:text-xl text-muted-foreground text-center mb-12">My professional background and qualifications</p>
        </div>

        <div class="max-w-4xl mx-auto h-[500px] md:h-[calc(100vh-200px)]">
          <div class="relative bg-card border border-border rounded-lg shadow-lg overflow-hidden h-full group">
            <div class="relative h-full">
              <div
                class="absolute inset-0 transition-opacity duration-500"
                [class.opacity-100]="currentPage === 0"
                [class.opacity-0]="currentPage !== 0"
              >
                <img
                  src="assets/images/cv-kenny-page-1.png"
                  alt="CV Page 1"
                  class="w-full h-full object-contain"
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
                  class="w-full h-full object-contain"
                />
              </div>
            </div>

            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                (click)="previousPage()"
                [disabled]="currentPage === 0"
                class="p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>

              <div class="flex gap-2">
                <button
                  (click)="goToPage(0)"
                  class="w-3 h-3 rounded-full transition-colors duration-200"
                  [class.bg-primary]="currentPage === 0"
                  [class.bg-muted]="currentPage !== 0"
                ></button>
                <button
                  (click)="goToPage(1)"
                  class="w-3 h-3 rounded-full transition-colors duration-200"
                  [class.bg-primary]="currentPage === 1"
                  [class.bg-muted]="currentPage !== 1"
                ></button>
              </div>

              <button
                (click)="nextPage()"
                [disabled]="currentPage === 1"
                class="p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>

            <div class="absolute top-4 right-4 z-10">
              <a
                href="assets/documents/cv-kenny-talbi.pdf"
                download="cv-kenny-talbi.pdf"
                class="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Download CV
              </a>
            </div>
          </div>
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
