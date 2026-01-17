import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LucideAngularModule, FileCode, Copy, Check } from 'lucide-angular';
import { codeToHtml } from 'shiki';

import { ThemeService } from '../../../../shared/services/theme.service';
import { FileTreeNode } from '../../models/file-tree.model';
import { FileTreeService } from '../../services/file-tree.service';

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'jsonc',
  json5: 'json5',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  styl: 'stylus',
  py: 'python',
  pyw: 'python',
  go: 'go',
  rs: 'rust',
  java: 'java',
  rb: 'ruby',
  php: 'php',
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  fish: 'fish',
  yml: 'yaml',
  yaml: 'yaml',
  tf: 'terraform',
  hcl: 'hcl',
  md: 'markdown',
  mdx: 'mdx',
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
  xml: 'xml',
  svg: 'xml',
  xsl: 'xml',
  toml: 'toml',
  ini: 'ini',
  properties: 'properties',
  cmake: 'cmake',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
  hxx: 'cpp',
  cs: 'csharp',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',
  prisma: 'prisma',
  proto: 'protobuf',
  nginx: 'nginx',
  conf: 'nginx',
  lua: 'lua',
  r: 'r',
  dart: 'dart',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  hs: 'haskell',
  clj: 'clojure',
  cljs: 'clojure',
  scala: 'scala',
  groovy: 'groovy',
  gradle: 'groovy',
  ps1: 'powershell',
  psm1: 'powershell',
  psd1: 'powershell',
  zig: 'zig',
  v: 'v',
  nim: 'nim',
  nix: 'nix',
  dhall: 'dhall',
  elm: 'elm',
  gleam: 'gleam',
  wasm: 'wasm',
  wat: 'wasm',
  tex: 'latex',
  latex: 'latex',
  bib: 'bibtex',
  diff: 'diff',
  patch: 'diff',
  log: 'log',
  http: 'http',
  rest: 'http',
  bat: 'bat',
  cmd: 'bat'
};

@Component({
  selector: 'app-code-preview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex h-full flex-col bg-card">
      @if (file()) {
        <div
          class="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3"
        >
          <div class="flex items-center gap-2 overflow-hidden">
            <lucide-angular
              [img]="FileCodeIcon"
              class="h-4 w-4 flex-shrink-0 text-muted-foreground"
            ></lucide-angular>
            <span class="truncate text-sm font-medium text-foreground">
              {{ file()!.path }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            @if (file()!.size) {
              <span class="text-xs text-muted-foreground">
                {{ formatFileSize(file()!.size!) }}
              </span>
            }
            <button
              class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              (click)="copyToClipboard()"
              [title]="copied() ? 'Copied!' : 'Copy to clipboard'"
            >
              <lucide-angular
                [img]="copied() ? CheckIcon : CopyIcon"
                class="h-4 w-4"
              ></lucide-angular>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-auto">
          @if (isImageFile()) {
            <div class="flex items-center justify-center p-8">
              <div class="text-center">
                <div class="mb-2 text-4xl">🖼️</div>
                <p class="text-muted-foreground">Image preview not available</p>
              </div>
            </div>
          } @else if (isBinaryFile()) {
            <div class="flex items-center justify-center p-8">
              <div class="text-center">
                <div class="mb-2 text-4xl">📦</div>
                <p class="text-muted-foreground">Binary file - cannot display</p>
              </div>
            </div>
          } @else if (isLoading()) {
            <div class="flex items-center justify-center p-8">
              <div
                class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary"
              ></div>
            </div>
          } @else {
            <div class="min-h-full [&>pre]:min-h-full [&>pre]:m-0 [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:!bg-transparent" [innerHTML]="html()"></div>
          }
        </div>
      } @else {
        <div class="flex h-full flex-col items-center justify-center gap-4 p-8">
          <div
            class="flex h-20 w-20 items-center justify-center rounded-full bg-muted"
          >
            <lucide-angular
              [img]="FileCodeIcon"
              class="h-10 w-10 text-muted-foreground"
            ></lucide-angular>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-medium text-foreground">
              Select a file to view
            </h3>
            <p class="mt-1 text-sm text-muted-foreground">
              Click on any file in the tree to view its contents
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class CodePreviewComponent {
  public file = input<FileTreeNode | null>(null);

  public copied = signal(false);
  public isLoading = signal(false);
  public html = signal<SafeHtml>('');

  public readonly FileCodeIcon = FileCode;
  public readonly CopyIcon = Copy;
  public readonly CheckIcon = Check;

  private readonly fileTreeService = inject(FileTreeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly themeService = inject(ThemeService);

  public isImageFile = computed(() => {
    const currentFile = this.file();
    if (!currentFile) {
      return false;
    }
    const ext = this.fileTreeService.getFileExtension(currentFile.path);
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext);
  });

  public isBinaryFile = computed(() => this.file()?.content === '[Binary file - cannot display]');

  constructor() {
    effect(() => {
      const currentFile = this.file();
      const currentTheme = this.themeService.theme();
      if (currentFile?.content && !this.isImageFile() && !this.isBinaryFile()) {
        this.loadCode(currentFile.content, currentFile.path, currentTheme);
      }
    });
  }

  private async loadCode(content: string, path: string, theme: 'light' | 'dark'): Promise<void> {
    this.isLoading.set(true);

    try {
      const language = this.getLanguage(path);
      const shikiTheme = theme === 'dark' ? 'github-dark' : 'github-light';
      const result = await codeToHtml(content, { lang: language, theme: shikiTheme });
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(result));
    } catch {
      const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(`<pre><code>${escaped}</code></pre>`));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getLanguage(path: string): string {
    const ext = this.fileTreeService.getFileExtension(path);
    return EXTENSION_TO_LANGUAGE[ext] || 'text';
  }

  public formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  public async copyToClipboard(): Promise<void> {
    const content = this.file()?.content;
    if (!content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
