% Build MATLAB Toolbox (.mltbx) for NiiVue
% This script creates a MATLAB Toolbox package that can be easily installed

% Ensure we're in the right directory
packageRoot = fileparts(mfilename('fullpath'));
projectRoot = fullfile(packageRoot, '..');

% Check if dist folder exists
distPath = fullfile(projectRoot, 'dist', 'index.html');
if ~exist(distPath, 'file')
    error('Build artifacts not found. Please run "pnpm build" first.');
end

% Create toolbox project file
prj = 'niivue_matlab.prj';
if exist(prj, 'file')
    delete(prj);
end

% Define toolbox properties
toolboxName = 'NiiVue for MATLAB';
toolboxVersion = '0.1.0';
toolboxAuthor = 'NiiVue Team';
toolboxSummary = 'High-performance neuroimaging visualization for MATLAB';
toolboxDescription = [...
    'NiiVue integration for MATLAB provides a modern, GPU-accelerated ', ...
    'neuroimaging viewer that runs directly in MATLAB using uihtml. ', ...
    'Features include: NIfTI volume loading, overlay support, ', ...
    'mesh visualization, multiple colormaps, and interactive controls.'];

% Create the toolbox using MATLAB's packaging tools
fprintf('Creating MATLAB Toolbox package...\n');
fprintf('Name: %s\n', toolboxName);
fprintf('Version: %s\n', toolboxVersion);

% Note: This requires MATLAB's toolbox packaging functionality
% For manual creation, use the following structure:
%
% NiiVue_MATLAB/
% ├── +niivue/
% │   ├── Controller.m
% │   ├── Viewer.m
% │   └── Component.m
% ├── dist/
% │   └── index.html
% └── examples/
%     └── basic_usage.m

fprintf('\nTo manually create the toolbox:\n');
fprintf('1. Open MATLAB Toolbox Packager (Home > Add-Ons > Package Toolbox)\n');
fprintf('2. Add the following folders:\n');
fprintf('   - matlab/+niivue/\n');
fprintf('   - dist/\n');
fprintf('   - matlab/examples/\n');
fprintf('3. Set toolbox properties:\n');
fprintf('   - Name: %s\n', toolboxName);
fprintf('   - Version: %s\n', toolboxVersion);
fprintf('   - Author: %s\n', toolboxAuthor);
fprintf('   - Summary: %s\n', toolboxSummary);
fprintf('4. Package and save as niivue_matlab.mltbx\n');

fprintf('\nAlternatively, install directly by adding to MATLAB path:\n');
fprintf('  addpath(''%s'')\n', fullfile(projectRoot, 'matlab'));
fprintf('  savepath\n');
