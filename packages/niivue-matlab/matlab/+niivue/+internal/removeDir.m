function removeDir(d)
%REMOVEDIR Delete a session folder, tolerating files the browser still holds.
%
%   The embedded browser can keep a handle on a fetched file briefly after the
%   component is destroyed, so failure here is expected and harmless: the folder
%   is under tempdir and the OS reclaims it.

    if isempty(d) || ~exist(d, 'dir')
        return
    end
    try %#ok<TRYNC>
        rmdir(d, 's');
    end
end
