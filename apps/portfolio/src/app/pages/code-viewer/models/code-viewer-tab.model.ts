import { SafeHtml } from '@angular/platform-browser';

import { FileTreeNode } from './file-tree.model';

export interface CodeViewerTab {
  node: FileTreeNode;
  cachedCodeHtml: SafeHtml | null;
  isImage: boolean;
  isBinaryFile: boolean;
}
