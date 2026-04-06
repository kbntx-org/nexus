import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { unzipSync } from 'fflate';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { codeToHtml } from 'shiki';

import { ThemeService } from '../../../shared/services/theme.service';
import { CodeViewerTab } from '../models/code-viewer-tab.model';
import { getLanguage, isImageFile } from '../models/file-mappings.model';
import { FileTreeNode } from '../models/file-tree.model';

@Injectable({
  providedIn: 'root'
})
export class FileTreeService {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly themeService = inject(ThemeService);

  private treeSubject = new BehaviorSubject<FileTreeNode | null>(null);
  private selectedNodeSubject = new BehaviorSubject<FileTreeNode | null>(null);
  private searchQuerySubject = new BehaviorSubject<string>('');
  private repoNameSubject = new BehaviorSubject<string>('');
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private codeHtmlSubject = new BehaviorSubject<SafeHtml>('');
  private isCodeLoadingSubject = new BehaviorSubject<boolean>(false);
  private openTabsSubject = new BehaviorSubject<CodeViewerTab[]>([]);
  private activeTabIndexSubject = new BehaviorSubject<number>(-1);

  public tree$ = this.treeSubject.asObservable();
  public selectedNode$ = this.selectedNodeSubject.asObservable();
  public searchQuery$ = this.searchQuerySubject.asObservable();
  public repoName$ = this.repoNameSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public codeHtml$ = this.codeHtmlSubject.asObservable();
  public isCodeLoading$ = this.isCodeLoadingSubject.asObservable();
  public openTabs$ = this.openTabsSubject.asObservable();
  public activeTabIndex$ = this.activeTabIndexSubject.asObservable();

  public filteredTree$ = combineLatest([this.tree$, this.searchQuery$]).pipe(
    map(([tree, query]) => {
      if (!tree) {
        return null;
      }
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery) {
        return tree;
      }
      return this.filterTreeNode(tree, trimmedQuery);
    })
  );

  public isImage$ = this.selectedNode$.pipe(map(node => (node ? isImageFile(node.path) : false)));

  public isBinaryFile$ = this.selectedNode$.pipe(
    map(node => node?.content === '[Binary file - cannot display]')
  );

  public areAllExpanded$ = combineLatest([this.filteredTree$, this.searchQuery$]).pipe(
    map(([tree, query]) => {
      if (!tree) {
        return false;
      }
      if (query.trim()) {
        return true;
      }
      return this.areAllExpanded(tree);
    })
  );

  public loadRepository(url: string, name: string): void {
    this.repoNameSubject.next(name);
    this.selectedNodeSubject.next(null);
    this.searchQuerySubject.next('');
    this.openTabsSubject.next([]);
    this.activeTabIndexSubject.next(-1);
    this.codeHtmlSubject.next('');
    this.isLoadingSubject.next(true);

    this.http.get(url, { responseType: 'arraybuffer' }).subscribe({
      next: buffer => {
        const tree = this.parseZipBuffer(new Uint8Array(buffer));
        this.treeSubject.next(tree);
        this.isLoadingSubject.next(false);
      },
      error: () => {
        this.isLoadingSubject.next(false);
      }
    });
  }

  public toggleExpand(node: FileTreeNode): void {
    node.expanded = !node.expanded;
    this.treeSubject.next(this.treeSubject.value);
  }

  public selectFile(node: FileTreeNode): void {
    const currentTabs = this.openTabsSubject.value;
    const existingIndex = currentTabs.findIndex(tab => tab.node.path === node.path);

    if (existingIndex >= 0) {
      this.activateTabByIndex(existingIndex);
      return;
    }

    const newTab: CodeViewerTab = {
      node,
      cachedCodeHtml: null,
      isImage: isImageFile(node.path),
      isBinaryFile: node.content === '[Binary file - cannot display]'
    };

    const updatedTabs = [...currentTabs, newTab];
    const newIndex = updatedTabs.length - 1;
    this.openTabsSubject.next(updatedTabs);
    this.activateTabByIndex(newIndex);

    if (node.content && !newTab.isImage && !newTab.isBinaryFile) {
      this.loadCodeHighlightingForTab(newIndex, node.content, node.path);
    }
  }

  public activateTabByIndex(index: number): void {
    const tabs = this.openTabsSubject.value;
    if (index < 0 || index >= tabs.length) {
      return;
    }

    this.activeTabIndexSubject.next(index);
    const tab = tabs[index];
    this.selectedNodeSubject.next(tab.node);

    if (tab.cachedCodeHtml !== null) {
      this.codeHtmlSubject.next(tab.cachedCodeHtml);
      this.isCodeLoadingSubject.next(false);
    } else if (!tab.isImage && !tab.isBinaryFile && tab.node.content) {
      this.loadCodeHighlightingForTab(index, tab.node.content, tab.node.path);
    }
  }

  public closeTab(index: number): void {
    const currentTabs = this.openTabsSubject.value;
    if (index < 0 || index >= currentTabs.length) {
      return;
    }

    const updatedTabs = currentTabs.filter((_, tabIndex) => tabIndex !== index);
    this.openTabsSubject.next(updatedTabs);

    if (updatedTabs.length === 0) {
      this.activeTabIndexSubject.next(-1);
      this.selectedNodeSubject.next(null);
      this.codeHtmlSubject.next('');
      return;
    }

    const currentActiveIndex = this.activeTabIndexSubject.value;
    if (index === currentActiveIndex) {
      const newIndex = index >= updatedTabs.length ? updatedTabs.length - 1 : index;
      this.activateTabByIndex(newIndex);
    } else if (index < currentActiveIndex) {
      this.activeTabIndexSubject.next(currentActiveIndex - 1);
    }
  }

  public setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
    if (query.trim()) {
      this.expandAll();
    }
  }

  public async reloadCodeHighlighting(): Promise<void> {
    const currentTabs = this.openTabsSubject.value;
    currentTabs.forEach(tab => {
      tab.cachedCodeHtml = null;
    });
    this.openTabsSubject.next([...currentTabs]);

    const activeIndex = this.activeTabIndexSubject.value;
    if (activeIndex >= 0 && activeIndex < currentTabs.length) {
      const activeTab = currentTabs[activeIndex];
      if (activeTab.node.content && !activeTab.isImage && !activeTab.isBinaryFile) {
        await this.loadCodeHighlightingForTab(
          activeIndex,
          activeTab.node.content,
          activeTab.node.path
        );
      }
    }
  }

  public toggleExpandAll(): void {
    const tree = this.treeSubject.value;
    if (!tree) {
      return;
    }

    const hasSearchQuery = this.searchQuerySubject.value.trim().length > 0;
    const allExpanded = hasSearchQuery || this.areAllExpanded(tree);

    // Clear search when collapsing (since search forces expansion)
    if (allExpanded && hasSearchQuery) {
      this.searchQuerySubject.next('');
    }

    this.setExpandedRecursive(tree, !allExpanded);
    this.treeSubject.next(tree);
  }

  public areAllExpanded(node: FileTreeNode): boolean {
    if (node.type === 'directory') {
      if (!node.expanded) {
        return false;
      }
      return node.children?.every(child => this.areAllExpanded(child)) ?? true;
    }
    return true;
  }

  private expandAll(): void {
    const tree = this.treeSubject.value;
    if (tree) {
      this.setExpandedRecursive(tree, true);
      this.treeSubject.next(tree);
    }
  }

  private setExpandedRecursive(node: FileTreeNode, expanded: boolean): void {
    if (node.type === 'directory') {
      node.expanded = expanded;
      node.children?.forEach(child => this.setExpandedRecursive(child, expanded));
    }
  }

  private async loadCodeHighlightingForTab(
    tabIndex: number,
    content: string,
    path: string
  ): Promise<void> {
    this.isCodeLoadingSubject.next(true);
    try {
      const language = getLanguage(path);
      const theme = this.themeService.theme() === 'dark' ? 'github-dark' : 'github-light';
      const result = await codeToHtml(content, { lang: language, theme });
      const safeHtml = this.sanitizer.bypassSecurityTrustHtml(result);

      const currentTabs = this.openTabsSubject.value;
      if (tabIndex < currentTabs.length && currentTabs[tabIndex].node.path === path) {
        currentTabs[tabIndex].cachedCodeHtml = safeHtml;
        this.openTabsSubject.next([...currentTabs]);
      }

      if (this.activeTabIndexSubject.value === tabIndex) {
        this.codeHtmlSubject.next(safeHtml);
      }
    } finally {
      this.isCodeLoadingSubject.next(false);
    }
  }

  private filterTreeNode(node: FileTreeNode, query: string): FileTreeNode | null {
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(query) ? node : null;
    }

    const nodeMatches = node.name.toLowerCase().includes(query);
    const filteredChildren = node.children
      ?.map(child => this.filterTreeNode(child, query))
      .filter((child): child is FileTreeNode => child !== null);

    if (!filteredChildren?.length && !nodeMatches) {
      return null;
    }

    if (nodeMatches) {
      return {
        ...node,
        expanded: true,
        children: node.children
      };
    }

    return { ...node, children: filteredChildren };
  }

  private parseZipBuffer(buffer: Uint8Array): FileTreeNode {
    const files = unzipSync(buffer);
    return this.buildTree(files);
  }

  private buildTree(files: Record<string, Uint8Array>): FileTreeNode {
    const root: FileTreeNode = {
      name: 'root',
      path: '',
      type: 'directory',
      children: [],
      expanded: false
    };

    for (const [filePath, content] of Object.entries(files)) {
      if (filePath.endsWith('/')) {
        continue;
      }

      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        let child = current.children?.find(c => c.name === part);

        if (!child) {
          child = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'directory',
            expanded: false,
            ...(isFile ? { content: this.decodeContent(content) } : { children: [] })
          };
          current.children!.push(child);
        }

        current = child;
      });
    }

    this.sortTree(root);
    return this.unwrapSingleRootFolder(root);
  }

  private unwrapSingleRootFolder(root: FileTreeNode): FileTreeNode {
    if (root.children?.length === 1 && root.children[0].type === 'directory') {
      const rootFolderName = root.children[0].name;
      const unwrapped = { ...root, children: root.children[0].children };
      this.stripPathPrefix(unwrapped, rootFolderName + '/');
      return unwrapped;
    }
    return root;
  }

  private stripPathPrefix(node: FileTreeNode, prefix: string): void {
    if (node.path.startsWith(prefix)) {
      node.path = node.path.substring(prefix.length);
    }
    node.children?.forEach(child => this.stripPathPrefix(child, prefix));
  }

  private decodeContent(content: Uint8Array): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(content);
    } catch {
      return '[Binary file - cannot display]';
    }
  }

  private sortTree(node: FileTreeNode): void {
    node.children?.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    node.children?.forEach(child => this.sortTree(child));
  }
}
