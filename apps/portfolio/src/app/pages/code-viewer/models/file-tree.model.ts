export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  content?: string;
  size?: number;
}

export interface RepoMetadata {
  name: string;
  version: string;
  lastUpdated?: string;
}

