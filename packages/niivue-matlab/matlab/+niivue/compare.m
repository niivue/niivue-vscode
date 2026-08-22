function v = compare(files, opts)
%NIIVUE.COMPARE Open several images side by side, with a shared crosshair.
%
%   niivue.compare(["mean.nii" "T1.nii" "atlas.nii"])
%   niivue.compare("derivatives/*_T1w.nii.gz")
%   niivue.compare("sub-01/anat")
%   niivue.compare(dir("**/*_bold.nii.gz"))
%
%   Each image gets its own panel and one crosshair drives all of them, at the
%   same world position - so you are always comparing the same anatomy. There
%   is no limit on the number of panels.
%
%   To stack images as overlays in a single panel instead, use NIIVUE.SHOW.
%
%   See also NIIVUE.SHOW, NIIVUE.CHECKREG, NIIVUE.VIEWER.

    arguments
        files
        opts.Layout (1,1) string = "axial"
        opts.Name (1,1) string = "NiiVue - compare"
    end

    v = niivue.Viewer(Name=opts.Name);
    v.openTiles(files);
    v.Layout = opts.Layout;
    if nargout == 0
        clear v
    end
end
