const { execSync } = require('child_process');
const path = require('path');

console.log('Running database-related tests...\n');

const testCommands = [
  {
    name: 'Model Tests',
    command: 'jest tests/models --verbose',
  },
  {
    name: 'Service Tests',
    command: 'jest tests/services --verbose',
  },
  {
    name: 'Integration Tests',
    command: 'jest tests/integration --verbose',
  },
  {
    name: 'All Database Tests',
    command: 'jest tests/models tests/services tests/integration --coverage',
  }
];

testCommands.forEach((test, index) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Running ${test.name}...`);
  console.log('='.repeat(50));

  try {
    execSync(test.command, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    console.log(`✅ ${test.name} passed`);
  } catch (error) {
    console.error(`❌ ${test.name} failed`);
    process.exit(1);
  }
});

console.log('\n🎉 All database tests completed successfully!');