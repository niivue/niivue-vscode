# NiiVue MATLAB Tests

This directory contains unit tests for the NiiVue MATLAB integration package.

## Running Tests Locally

### Prerequisites

- MATLAB R2020b or later (R2023b+ recommended)
- The niivue-matlab package built (run `pnpm build` in `packages/niivue-matlab`)

### Running All Tests

```matlab
cd packages/niivue-matlab/matlab/tests
results = runTests();
```

### Running Individual Test Classes

```matlab
cd packages/niivue-matlab/matlab/tests
suite = matlab.unittest.TestSuite.fromClass(?NiiVueMatlabTests);
runner = matlab.unittest.TestRunner.withTextOutput;
results = runner.run(suite);
```

## Test Coverage

The tests verify:

- **Package Structure**: Verifies that all classes and functions exist
- **Class Methods**: Checks that Controller and Component have expected methods
- **Class Properties**: Verifies properties are defined correctly
- **Path Resolution**: Tests that the HTML viewer path can be resolved
- **Dependencies**: Confirms MATLAB built-in functions are available

## CI/CD Integration

Tests run automatically on GitHub Actions when:
- Changes are pushed to the `main` branch affecting `packages/niivue-matlab/`
- Pull requests are created affecting `packages/niivue-matlab/`

The workflow tests against multiple MATLAB versions:
- R2020b (oldest supported)
- R2024b (newest release)

## Adding New Tests

To add new tests:

1. Create a new test class inheriting from `matlab.unittest.TestCase`
2. Place it in this directory
3. Add test methods with the `methods (Test)` block
4. The `runTests()` function will automatically discover and run it

Example:

```matlab
classdef MyNewTests < matlab.unittest.TestCase
    methods (Test)
        function testSomething(testCase)
            testCase.verifyTrue(true, 'Should pass');
        end
    end
end
```

## Test Results

Test results are uploaded as artifacts in GitHub Actions:
- XML format for CI/CD integration
- Detailed logs for debugging failures

## Notes

- Tests are designed to run without requiring a display (headless mode)
- Tests do NOT create actual UI components to avoid platform dependencies
- Tests focus on API validation and structural correctness
