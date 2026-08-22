function v = show(varargin)
%NIIVUE.SHOW Open a viewer on one or more images, stacked as overlays.
%
%   niivue.show("T1.nii")
%   niivue.show("T1.nii", "spmT_0001.nii")
%   niivue.show(["T1.nii" "spmT_0001.nii"])
%   v = niivue.show("T1.nii");        keep the handle to keep controlling it
%
%   The first image is the background; any others are layered over it with the
%   hot colormap at 60% opacity, the usual overlay convention. For finer
%   control use NIIVUE.VIEWER and addVolume directly.
%
%   To put each image in its own panel instead of stacking them, use
%   NIIVUE.COMPARE.
%
%   See also NIIVUE.COMPARE, NIIVUE.VIEWER, NIIVUE.CHECKREG.

    files = strings(1, 0);
    for k = 1:numel(varargin)
        files = [files, niivue.internal.resolveFiles(varargin{k})]; %#ok<AGROW>
    end

    v = niivue.Viewer();
    for k = 1:numel(files)
        if k == 1
            v.addVolume(files(k));
        else
            v.addVolume(files(k), Colormap="hot", Opacity=0.6);
        end
    end
    if nargout == 0
        clear v
    end
end
