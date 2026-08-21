function v = show(varargin)
%NIIVUE.SHOW Open a viewer on one or more images, in one line.
%
%   niivue.show("T1.nii")
%   niivue.show("T1.nii", "stat.nii")
%   v = niivue.show("T1.nii");        keep the handle to keep controlling it
%
%   The first image is the background; any others are layered over it with the
%   hot colormap at 60% opacity, which is the usual overlay convention. For
%   finer control use niivue.Viewer and addVolume directly.
%
%   See also NIIVUE.VIEWER, NIIVUE.CHECKREG.

    v = niivue.Viewer();
    for k = 1:numel(varargin)
        if k == 1
            v.addVolume(varargin{k});
        else
            v.addVolume(varargin{k}, Colormap="hot", Opacity=0.6);
        end
    end
    if nargout == 0
        clear v
    end
end
