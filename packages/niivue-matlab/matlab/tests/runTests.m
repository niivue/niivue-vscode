function results = runTests(opts)
%RUNTESTS Run the NiiVue MATLAB test suite.
%
%   runTests                     everything this session can run
%   runTests(Unit=true)          data-path tests only, no display needed
%   runTests(RequireViewer=true) fail if the viewer tests could not run
%   runTests(JUnit="out.xml")    also write a JUnit report for CI
%
%   Viewer tests are skipped rather than failed when the session cannot host
%   one; run niivue.diagnose to find out why. Use RequireViewer on machines
%   that are supposed to be able to render - otherwise a suite that skipped
%   everything reports the same "0 failed" as one that genuinely passed.

    arguments
        opts.Unit (1,1) logical = false
        opts.RequireViewer (1,1) logical = false
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

    passed = nnz([results.Passed]);
    failed = nnz([results.Failed]);
    skipped = nnz([results.Incomplete]);

    fprintf('\n%s\n', repmat('=', 1, 46));
    fprintf('  passed %d   failed %d   skipped %d   of %d\n', ...
        passed, failed, skipped, numel(results));
    fprintf('%s\n\n', repmat('=', 1, 46));

    if failed > 0
        error('niivue:testsFailed', '%d test(s) failed.', failed);
    end

    if ~opts.Unit
        isViewer = startsWith({results.Name}, 'tViewer');
        ranViewer = nnz(isViewer & [results.Passed]);
        if ranViewer == 0 && any(isViewer)
            msg = ['No viewer test actually ran - all %d were skipped. The bridge ' ...
                   'was not exercised. Run niivue.diagnose to see what this session ' ...
                   'is missing.'];
            if opts.RequireViewer
                error('niivue:viewerTestsSkipped', msg, nnz(isViewer));
            end
            warning('niivue:viewerTestsSkipped', msg, nnz(isViewer));
        end
    end
end
