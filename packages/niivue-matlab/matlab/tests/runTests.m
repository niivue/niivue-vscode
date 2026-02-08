function results = runTests()
    % RUNTESTS Run all MATLAB tests for NiiVue package
    %   This script runs the unit tests and generates a results report
    
    % Get the directory of this script
    scriptDir = fileparts(mfilename('fullpath'));
    
    % Add the matlab package to the path
    packageRoot = fileparts(scriptDir);
    addpath(packageRoot);
    
    % Create test suite
    import matlab.unittest.TestSuite;
    import matlab.unittest.TestRunner;
    import matlab.unittest.plugins.CodeCoveragePlugin;
    import matlab.unittest.plugins.XMLPlugin;
    
    % Create suite from all tests in the tests directory
    suite = TestSuite.fromFolder(scriptDir);
    
    % Create test runner
    runner = TestRunner.withTextOutput;
    
    % Add XML plugin for CI/CD integration
    % Find the repo root (go up 4 levels from tests dir)
    repoRoot = fileparts(fileparts(fileparts(fileparts(scriptDir))));
    testResultsDir = fullfile(repoRoot, 'test-results');
    
    if ~exist(testResultsDir, 'dir')
        mkdir(testResultsDir);
    end
    
    xmlFile = fullfile(testResultsDir, 'matlab-test-results.xml');
    runner.addPlugin(XMLPlugin.producingJUnitFormat(xmlFile));
    
    % Run tests
    results = runner.run(suite);
    
    % Display summary
    fprintf('\n========================================\n');
    fprintf('Test Summary\n');
    fprintf('========================================\n');
    fprintf('Total tests: %d\n', numel(results));
    fprintf('Passed: %d\n', sum([results.Passed]));
    fprintf('Failed: %d\n', sum([results.Failed]));
    fprintf('Incomplete: %d\n', sum([results.Incomplete]));
    fprintf('========================================\n\n');
    
    % Exit with error code if any tests failed
    if any([results.Failed]) || any([results.Incomplete])
        error('Some tests failed or were incomplete');
    end
end
