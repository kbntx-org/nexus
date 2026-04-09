import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import fm from 'front-matter';
import { marked } from 'marked';
import { firstValueFrom } from 'rxjs';

const HOME_FILE = 'assets/content/home/index.md';

export interface HeroData {
  name: string;
  title: string;
  subtitle: string;
  description: string;
}

type HeroMetadata = Omit<HeroData, 'description'>;

@Injectable()
export class HomeService {
  private readonly httpClient = inject(HttpClient);

  private readonly heroSignal = signal<HeroData | null>(null);
  public readonly hero = this.heroSignal.asReadonly();

  constructor() {
    this.loadHomeContent();
  }

  private async loadHomeContent(): Promise<void> {
    const raw = await firstValueFrom(this.httpClient.get(HOME_FILE, { responseType: 'text' }));
    const parsed = fm<HeroMetadata>(raw);

    this.heroSignal.set({
      ...parsed.attributes,
      description: marked(parsed.body).toString()
    });
  }
}
