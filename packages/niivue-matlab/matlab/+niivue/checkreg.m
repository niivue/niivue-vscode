function v = checkreg(files, opts)
%NIIVUE.CHECKREG Compare images in one window, SPM Check Reg style.
%
%   niivue.checkreg(["mean.nii" "T1.nii" "atlas.nii"])
%
%   The name SPM users will reach for. Identical to NIIVUE.COMPARE, which is
%   the same thing without the SPM vocabulary. Unlike spm_check_registration
%   there is no 24-image limit.
%
%   See also NIIVUE.COMPARE, NIIVUE.SHOW.

    arguments
        files
        opts.Layout (1,1) string = "axial"
    end

    v = niivue.compare(files, Layout=opts.Layout, Name="NiiVue - Check Registration");
    if nargout == 0
        clear v
    end
end
