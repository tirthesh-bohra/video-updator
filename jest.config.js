module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.setup.js'],
    testEnvironmentOptions: {
      NODE_ENV: 'test'
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    }
};