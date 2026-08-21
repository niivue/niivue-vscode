function results = runTests(opts)
%RUNTESTS Run the NiiVue MATLAB test suite.
%
%   runTests                    everything available in this session
%   runTests(Unit=true)         data-path tests only, no display needed
%   runTests(JUnit="out.xml")   also write a JUnit report for CI
%
%   Viewer tests are skipped rather than failed when the session cannot host
%   one; run niivue.diagnose to find out why.

    arguments
        opts.Unit (1,1) logical = false
        opts.JUnit (1,1) string = ""
    end

    here = fileparts(mfilename('fullpath'));
    addpath(fileparts(here));   % put +niivue on the path

    import matlab.unittest.TestSuite
    import matlab.unittest.TestRunner
    import matlab.unittest.plugins.XMLPlugin

    if opts.Unit
        suite = TestSuite.fromFile(fullfile(here, 'tData.m'));
    else
        suite = TestSuite.fromFolder(here);
    end

    runner = TestRunner.withTextOutput;
    if strlength(opts.JUnit) > 0
        d = fileparts(opts.JUnit);
        if strlength(d) > 0 && ~exist(d, 'dir')
            mkdir(d);
        end
        runner.addPlugin(XMLPlugin.producingJUnitFormat(char(opts.JUnit)));
    end

    results = runner.run(suite);

    fprintf('\n%s\n', repmat('=', 1, 46));
    fprintf('  passed %d   failed %d   skipped %d   of %d\n', ...
        nnz([results.Passed]), nnz([results.Failed]), ...
        nnz([results.Incomplete]), numel(results));
    fprintf('%s\n\n', repmat('=', 1, 46));

    if any([results.Failed])
        error('niivue:testsFailed', '%d test(s) failed.', nnz([results.Failed]));
    end
end
