export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
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

export const EXTENSION_TO_ICON_TYPE: Record<string, string> = {
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

export const FILENAME_TO_ICON_TYPE: Record<string, string> = {
  dockerfile: 'docker',
  '.gitignore': 'git',
  'package.json': 'npm',
  'tsconfig.json': 'typescript',
  'readme.md': 'readme'
};

export const ICON_TYPE_TO_COLOR: Record<string, string> = {
  typescript: 'text-blue-600',
  javascript: 'text-yellow-500',
  json: 'text-yellow-600',
  html: 'text-orange-500',
  css: 'text-blue-400',
  python: 'text-green-500',
  markdown: 'text-gray-500',
  readme: 'text-gray-500',
  yaml: 'text-purple-500',
  config: 'text-purple-500',
  shell: 'text-green-600',
  terraform: 'text-violet-600',
  image: 'text-pink-500',
  docker: 'text-sky-500',
  npm: 'text-red-500',
  lock: 'text-gray-400',
  git: 'text-orange-600',
  go: 'text-cyan-500',
  rust: 'text-orange-700',
  java: 'text-red-600',
  ruby: 'text-red-500',
  php: 'text-indigo-500'
};

export const ICON_TYPE_TO_NAME: Record<string, string> = {
  typescript: 'file-code',
  javascript: 'file-code',
  python: 'file-code',
  go: 'file-code',
  rust: 'file-code',
  java: 'file-code',
  ruby: 'file-code',
  php: 'file-code',
  html: 'file-code',
  css: 'file-code',
  json: 'file-json',
  markdown: 'file-text',
  readme: 'file-text',
  image: 'image',
  config: 'settings',
  yaml: 'settings',
  terraform: 'settings',
  shell: 'terminal',
  npm: 'package',
  lock: 'lock',
  file: 'file'
};

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'];

export function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getIconType(path: string): string {
  const filename = path.split('/').pop()?.toLowerCase() || '';
  const ext = getFileExtension(path);

  if (FILENAME_TO_ICON_TYPE[filename]) {
    return FILENAME_TO_ICON_TYPE[filename];
  }

  return EXTENSION_TO_ICON_TYPE[ext] || 'file';
}

export function getIconColor(iconType: string): string {
  return ICON_TYPE_TO_COLOR[iconType] || 'text-muted-foreground';
}

export function getIconName(path: string): string {
  const iconType = getIconType(path);
  return ICON_TYPE_TO_NAME[iconType] || 'file';
}

export function getLanguage(path: string): string {
  const ext = getFileExtension(path);
  return EXTENSION_TO_LANGUAGE[ext] || 'text';
}

export function isImageFile(path: string): boolean {
  const ext = getFileExtension(path);
  return IMAGE_EXTENSIONS.includes(ext);
}

