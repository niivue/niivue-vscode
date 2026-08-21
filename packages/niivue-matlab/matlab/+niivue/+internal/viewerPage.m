function p = viewerPage()
%VIEWERPAGE Absolute path to the built single-file viewer.
%
%   Resolved relative to this file so the package works from a plain addpath as
%   well as from an installed toolbox.

    here = fileparts(mfilename('fullpath'));            % .../matlab/+niivue/+internal
    pkgRoot = fileparts(fileparts(fileparts(here)));    % package root
    p = fullfile(pkgRoot, 'dist', 'index.html');

    if ~isfile(p)
        error('niivue:viewerMissing', ...
            ['The viewer bundle is missing.\n' ...
             'Expected: %s\n\n' ...
             'If you are working from a source checkout, build it first:\n' ...
             '    pnpm --filter @niivue/matlab build'], p);
    end
end
