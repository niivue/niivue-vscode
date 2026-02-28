function nv = Viewer(varargin)
%VIEWER Launch a standalone NiiVue viewer
%   niivue.Viewer() launches an empty viewer
%   niivue.Viewer(filepath) launches viewer with the specified NIfTI file
%   niivue.Viewer(filepath1, filepath2, ...) loads multiple files
%   nv = niivue.Viewer(...) returns a Controller object for further control
%
%   Example:
%       niivue.Viewer('T1.nii')
%       nv = niivue.Viewer('T1.nii', 'fMRI.nii')
%       nv.setColormap('hot', 2)

% Create a new controller (which creates the figure and viewer)
nv = niivue.Controller();

% Set figure name
nv.Figure.Name = 'NiiVue Viewer';

% Load any files passed as arguments
for i = 1:length(varargin)
    filepath = varargin{i};
    if ischar(filepath) || isstring(filepath)
        try
            nv.addVolume(char(filepath));
        catch ME
            warning('Failed to load file %s: %s', filepath, ME.message);
        end
    else
        warning('Argument %d is not a valid filepath', i);
    end
end

% If no output argument, don't return the controller
if nargout == 0
    clear nv;
end

end
