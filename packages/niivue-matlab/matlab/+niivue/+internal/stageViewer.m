function sessionDir = stageViewer()
%STAGEVIEWER Create a per-viewer folder holding a copy of the viewer page.
%
%   MATLAB serves the folder containing HTMLSource to the embedded browser, so
%   that folder is also where data files have to land. Serving the installed
%   package directly would mean writing scratch files into the installation, so
%   each viewer gets its own temporary copy instead. It is one ~2 MB file copy.

    sweepStaleSessions();

    src = niivue.internal.viewerPage();
    sessionDir = [tempname '_niivue'];
    mkdir(sessionDir);
    copyfile(src, fullfile(sessionDir, 'index.html'));
end

function sweepStaleSessions()
%SWEEPSTALESESSIONS Delete session folders left behind by earlier viewers.
%
%   The Bridge removes its own folder on destruction, but a destructor does not
%   always run - MATLAB exiting under -batch, or a hard stop, leaves the folder
%   behind. Sweeping on the way in is the reliable half of the pair.
%
%   Only folders older than an hour are touched, and failure is ignored: a
%   folder belonging to a live viewer in another MATLAB still has its page open,
%   so the delete fails and it is correctly left alone.

    persistent swept
    if ~isempty(swept)
        return      % once per session is enough
    end
    swept = true;

    try
        entries = dir(fullfile(tempdir, '*_niivue'));
    catch
        return
    end

    cutoff = now - 1/24; %#ok<TNOW1>  datenum hours; matches dir().datenum
    for k = 1:numel(entries)
        e = entries(k);
        if ~e.isdir || e.datenum > cutoff
            continue
        end
        try %#ok<TRYNC>
            rmdir(fullfile(e.folder, e.name), 's');
        end
    end
end
