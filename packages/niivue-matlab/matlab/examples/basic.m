%% NiiVue for MATLAB - basic usage
% Run section by section (Ctrl+Enter).

%% The one-liner
% Point it at any image your analysis already produced.
% niivue.show("T1.nii")

%% A synthetic volume, so this script runs with no data files
[x, y, z] = ndgrid(linspace(-1, 1, 64), linspace(-1, 1, 64), linspace(-1, 1, 40));
brain = single(exp(-(x.^2 + y.^2 + z.^2) * 3));

v = niivue.Viewer(Name="NiiVue example");
v.addVolume(brain, VoxelSize=[3 3 3], Name="phantom.nii");

%% Lay a "statistical map" over it
blob = single(exp(-((x - 0.3).^2 + (y - 0.2).^2 + z.^2) * 40) * 10);
v.addVolume(blob, VoxelSize=[3 3 3], Name="stat.nii", ...
    Colormap="hot", Threshold=[2 9], Opacity=0.7);

%% Move the crosshair, and read it back
v.Crosshair = [20 15 0];
fprintf("crosshair now at %.1f %.1f %.1f mm\n", v.Crosshair);

%% What is under the cursor, layer by layer
values = v.intensityAt([20 15 0]);
for k = 1:numel(values)
    fprintf("  %-14s %.3f\n", values(k).name, values(k).value);
end

%% Follow the user around
lh = addlistener(v, "CrosshairMoved", @(~, e) ...
    fprintf("moved to %.1f %.1f %.1f mm\n", e.Millimetres));
disp("Click in the viewer - positions will print here.")

%% Change the layout
v.Layout = "axial";
pause(1)
v.Layout = "multiplanar";

%% Capture it for a figure
img = v.snapshot();
figure, imshow(img), title("Captured from NiiVue")

%% Clean up
% delete(lh); delete(v);
