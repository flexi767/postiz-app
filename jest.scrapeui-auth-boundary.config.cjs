module.exports = {
  displayName: 'scrapeui-auth-boundary',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/frontend/src/components/auth'],
  testMatch: [
    '<rootDir>/apps/frontend/src/components/auth/scrapeui-sso-entry.spec.ts',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: {
          esModuleInterop: true,
          isolatedModules: true,
          module: 'commonjs',
          target: 'es2020',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@gitroom/react/(.*)$':
      '<rootDir>/libraries/react-shared-libraries/src/$1',
  },
};
