/* eslint-disable */
export default {
  displayName: 'cf-ingress-controller',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/platform/cf-ingress-controller',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@kubernetes/client-node$': '<rootDir>/src/__mocks__/kubernetes.ts'
  }
};
