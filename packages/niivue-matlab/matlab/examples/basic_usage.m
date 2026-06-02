% Example 1: Quick Viewer
% Launch a standalone viewer with a NIfTI file
% niivue.Viewer('path/to/your/T1.nii');

%% Example 2: Programmatic Control
% Create a controller for advanced manipulation
nv = niivue.Controller();

% Add a structural scan
% nv.addVolume('T1.nii', 'colormap', 'gray');

% Add functional overlay
% nv.addVolume('activation.nii', 'colormap', 'hot', 'opacity', 0.5);

% Navigate to a specific coordinate
% nv.setCrosshair(64, 64, 32);

%% Example 3: Multiple Views
% Open multiple viewers with different files
% nv1 = niivue.Viewer('subject1.nii');
% nv2 = niivue.Viewer('subject2.nii');

%% Example 4: Mesh Visualization
% nv = niivue.Controller();
% nv.addMesh('brain_surface.obj');
% nv.addVolume('overlay.nii', 'colormap', 'hot', 'opacity', 0.7);

%% Example 5: Interactive Exploration
% Create viewer and monitor crosshair position
nv = niivue.Controller();
% nv.addVolume('T1.nii');

% In a loop or timer, check crosshair position:
% disp(nv.CrosshairPos);

%% Example 6: Batch Processing Visualization
% Visualize results from a batch analysis
% subjects = {'sub01', 'sub02', 'sub03'};
% for i = 1:length(subjects)
%     filepath = fullfile('data', subjects{i}, 'T1.nii');
%     niivue.Viewer(filepath);
% end
