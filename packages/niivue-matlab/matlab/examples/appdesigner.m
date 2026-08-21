%% Embedding NiiVue in an App Designer app
%
% niivue.Component is a ComponentContainer, so it drops into a uifigure or a
% uigridlayout like any other component. Everything scriptable lives on the
% Viewer underneath, so there is one API rather than two.

fig = uifigure(Name="NiiVue in an app", Position=[100 100 900 600]);
grid = uigridlayout(fig, [2 1], RowHeight={'1x', 30});

nvComponent = niivue.Component(grid);
nvComponent.Layout.Row = 1;

label = uilabel(grid, Text="Click in the viewer", HorizontalAlignment="center");
label.Layout.Row = 2;

[x, y, z] = ndgrid(linspace(-1, 1, 48), linspace(-1, 1, 48), linspace(-1, 1, 32));
nvComponent.Viewer.addVolume(single(exp(-(x.^2 + y.^2 + z.^2) * 3)), ...
    VoxelSize=[4 4 4], Name="phantom.nii");

addlistener(nvComponent.Viewer, "CrosshairMoved", @(~, e) ...
    set(label, "Text", sprintf("%.1f  %.1f  %.1f mm", e.Millimetres)));
