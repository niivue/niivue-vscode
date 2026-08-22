%% Opening many images at once
% Two different things "open several files" can mean, and the scripting
% shapes that get you there without building a list by hand.
%
% Run section by section (Ctrl+Enter).

%% Make a small set of images to play with
d = fullfile(tempdir, 'niivue-example-images');
if ~exist(d, 'dir'), mkdir(d); end
[x, y, z] = ndgrid(linspace(-1,1,48), linspace(-1,1,48), linspace(-1,1,32));
niivue.internal.writeNifti(fullfile(d,'sub-01_T1w.nii'), single(exp(-(x.^2+y.^2+z.^2)*3)),        [3 3 3]);
niivue.internal.writeNifti(fullfile(d,'sub-02_T1w.nii'), single(exp(-((x-0.4).^2+y.^2+z.^2)*3)),  [3 3 3]);
niivue.internal.writeNifti(fullfile(d,'sub-03_T1w.nii'), single(exp(-((sqrt(x.^2+y.^2)-0.5).^2)*20)), [3 3 3]);
fprintf('wrote three images to %s\n', d);

%% Side by side: one panel each, one shared crosshair
% This is the "are these registered to each other?" view.
v = niivue.compare(fullfile(d, '*_T1w.nii'));

%% Move the crosshair once - every panel follows, at the same world position
v.Crosshair = [12 0 0];

%% Same thing, other input shapes
% A folder:
%   niivue.compare(d)
% dir() output, straight in:
%   niivue.compare(dir(fullfile(d, '*.nii')))
% A string array built in a loop, which is the usual cohort case:
subjects = "sub-" + string(1:3, "%02d");
files = fullfile(d, subjects + "_T1w.nii");
disp(files')

%% Stacked instead: overlays in a single panel
% This is the "where is my statistical map?" view.
delete(v);
v = niivue.show(fullfile(d,'sub-01_T1w.nii'), fullfile(d,'sub-03_T1w.nii'));

%% Capture whatever is on screen, tiles included
img = v.snapshot();
figure, imshow(img), title('captured from NiiVue')

%% Clean up
% delete(v)
