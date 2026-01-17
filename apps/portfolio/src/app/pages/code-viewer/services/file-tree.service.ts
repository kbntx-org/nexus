import { Injectable } from '@angular/core';
import { unzipSync } from 'fflate';

import { FileTreeNode, RepoMetadata } from '../models/file-tree.model';

@Injectable({
  providedIn: 'root'
})
export class FileTreeService {
  private cachedTree: FileTreeNode | null = null;
  private cachedMetadata: RepoMetadata | null = null;

  public async loadFromZipUrl(zipUrl: string): Promise<FileTreeNode> {
    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch zip: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return this.parseZipBuffer(new Uint8Array(buffer));
  }

  public parseZipBuffer(buffer: Uint8Array): FileTreeNode {
    const files = unzipSync(buffer);
    const tree = this.buildTree(files);
    this.cachedTree = tree;
    return tree;
  }

  private buildTree(files: Record<string, Uint8Array>): FileTreeNode {
    const root: FileTreeNode = {
      name: 'root',
      path: '',
      type: 'directory',
      children: []
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
            ...(isFile
              ? {
                  content: this.decodeContent(content),
                  size: content.length
                }
              : { children: [] })
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
    if (
      root.children?.length === 1 &&
      root.children[0].type === 'directory'
    ) {
      const unwrapped = root.children[0];
      return {
        ...root,
        children: unwrapped.children
      };
    }
    return root;
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

  public getFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  public getFileIconType(path: string): string {
    const ext = this.getFileExtension(path);
    const filename = path.split('/').pop()?.toLowerCase() || '';

    if (filename === 'dockerfile') {
      return 'docker';
    }
    if (filename === '.gitignore') {
      return 'git';
    }
    if (filename === 'package.json') {
      return 'npm';
    }
    if (filename === 'tsconfig.json') {
      return 'typescript';
    }
    if (filename === 'readme.md') {
      return 'readme';
    }

    const iconMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'css',
      less: 'css',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      rb: 'ruby',
      php: 'php',
      sh: 'shell',
      bash: 'shell',
      zsh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      tf: 'terraform',
      md: 'markdown',
      mdx: 'markdown',
      lock: 'lock',
      toml: 'config',
      ini: 'config',
      env: 'config',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      ico: 'image',
      webp: 'image',
      pdf: 'document',
      doc: 'document',
      docx: 'document',
      gitignore: 'git',
      dockerignore: 'docker',
      dockerfile: 'docker'
    };

    return iconMap[ext] || 'file';
  }

  public getCachedTree(): FileTreeNode | null {
    return this.cachedTree;
  }

  public setMetadata(metadata: RepoMetadata): void {
    this.cachedMetadata = metadata;
  }

  public getMetadata(): RepoMetadata | null {
    return this.cachedMetadata;
  }
}
