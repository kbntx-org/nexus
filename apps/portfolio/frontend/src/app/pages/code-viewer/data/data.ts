export interface CodeSource {
  id: string;
  name: string;
  zipUrl: string;
}

export const CODE_SOURCES: CodeSource[] = [
  {
    id: 'nexus',
    name: 'nexus',
    zipUrl: 'https://fsn1.your-objectstorage.com/nexus-public-statics/code-sources/nexus.zip'
  }
];

export function getCodeSourceById(id: string): CodeSource | undefined {
  return CODE_SOURCES.find(source => source.id === id);
}
