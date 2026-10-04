module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', moduleResolution: 'node', ignoreDeprecations: '6.0' } }] },
};
