function v = checkreg(files, opts)
%NIIVUE.CHECKREG Compare images in one window, SPM Check Reg style.
%
%   niivue.checkreg(["mean.nii" "T1.nii" "atlas.nii"])
%
%   Loads every image into a single linked view so one crosshair reads the same
%   world position in all of them. Unlike spm_check_registration there is no
%   24-image limit.
%
%   See also NIIVUE.SHOW, NIIVUE.VIEWER.

    arguments
        files (1,:) string
        opts.Layout (1,1) string = "multiplanar"
    end

    v = niivue.Viewer(Name="NiiVue - Check Registration");
    for k = 1:numel(files)
        if k == 1
            v.addVolume(files(k));
        else
            v.addVolume(files(k), Opacity=0);   % loaded, hidden; toggle in the menu
        end
    end
    v.Layout = opts.Layout;
    if nargout == 0
        clear v
    end
end
