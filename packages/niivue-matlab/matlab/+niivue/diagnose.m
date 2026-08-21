function report = diagnose()
%NIIVUE.DIAGNOSE Check whether this MATLAB can run the viewer, and report why not.
%
%   niivue.diagnose            prints a report
%   r = niivue.diagnose        returns it as a struct
%
%   Run this first when a viewer fails to open.

    report = struct();
    report.Release = string(matlabRelease.Release);
    report.Supported = ~isMATLABReleaseOlderThan("R2023a");
    report.HasDisplay = usejava('desktop') || usejava('jvm');

    try
        report.ViewerBundle = string(niivue.internal.viewerPage());
        report.BundleFound = true;
    catch
        report.ViewerBundle = "";
        report.BundleFound = false;
    end

    report.InClassicFigure = ~isMATLABReleaseOlderThan("R2025a");

    if nargout == 0
        fprintf('\nNiiVue for MATLAB - diagnostics\n');
        fprintf('  MATLAB release        : %s\n', report.Release);
        fprintf('  Meets R2023a minimum  : %s\n', tf(report.Supported));
        fprintf('  Graphical session     : %s\n', tf(report.HasDisplay));
        fprintf('  Viewer bundle present : %s\n', tf(report.BundleFound));
        if report.BundleFound
            fprintf('    %s\n', report.ViewerBundle);
        else
            fprintf('    build it: pnpm --filter @niivue/matlab build\n');
        end
        fprintf('  Can embed in a classic figure (R2025a+) : %s\n', tf(report.InClassicFigure));
        if report.Supported && report.HasDisplay && report.BundleFound
            fprintf('\n  Looks good. Try: niivue.show("your-image.nii")\n\n');
        else
            fprintf('\n  Fix the items marked no above.\n\n');
        end
        clear report
    end
end

function s = tf(v)
    if v, s = 'yes'; else, s = 'no'; end
end
