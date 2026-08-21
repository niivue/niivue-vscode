function out = build_toolbox(outFile)
%BUILD_TOOLBOX Package NiiVue for MATLAB as an installable .mltbx.
%
%   build_toolbox                     writes niivue-matlab.mltbx here
%   build_toolbox("path/to/out.mltbx")
%
%   Requires the viewer bundle to be built first:
%       pnpm --filter @niivue/matlab build

    arguments
        outFile (1,1) string = ""
    end

    here = fileparts(mfilename('fullpath'));
    pkgRoot = fileparts(here);
    toolboxDir = fullfile(pkgRoot, 'matlab');

    bundle = fullfile(pkgRoot, 'dist', 'index.html');
    if ~isfile(bundle)
        error('niivue:bundleMissing', ...
            ['The viewer bundle is missing, so the toolbox would install a ' ...
             'viewer that cannot open.\nBuild it first:\n' ...
             '    pnpm --filter @niivue/matlab build']);
    end

    if strlength(outFile) == 0
        outFile = fullfile(pkgRoot, 'niivue-matlab.mltbx');
    end

    % ToolboxOptions builds the packaging definition in code, so there is no
    % .prj to keep in sync with the folder layout. R2023a+, which matches the
    % package's own minimum.
    opts = matlab.addons.toolbox.ToolboxOptions(toolboxDir, 'niivue-matlab-0001');
    opts.ToolboxName = "NiiVue for MATLAB";
    opts.ToolboxVersion = readVersion(pkgRoot);
    opts.Description = "GPU-accelerated viewer for NIfTI, DICOM, meshes and tractography.";
    opts.Summary = "Interactive 3-D medical image viewer inside a MATLAB figure.";
    opts.AuthorName = "NiiVue contributors";
    opts.MinimumMatlabRelease = "R2023a";
    opts.OutputFile = outFile;

    % The bundle lives outside matlab/, so add it explicitly.
    opts.ToolboxFiles = [opts.ToolboxFiles; string(bundle)];

    matlab.addons.toolbox.packageToolbox(opts);
    fprintf('Wrote %s\n', outFile);

    if nargout > 0
        out = outFile;
    end
end

function v = readVersion(pkgRoot)
    v = "0.1.0";
    p = fullfile(pkgRoot, 'package.json');
    if isfile(p)
        try
            j = jsondecode(fileread(p));
            if isfield(j, 'version')
                v = string(j.version);
            end
        catch
            % keep the default
        end
    end
end
