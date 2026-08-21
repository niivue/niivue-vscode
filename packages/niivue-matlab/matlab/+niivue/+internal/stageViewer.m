function sessionDir = stageViewer()
%STAGEVIEWER Create a per-viewer folder holding a copy of the viewer page.
%
%   MATLAB serves the folder containing HTMLSource to the embedded browser, so
%   that folder is also where data files have to land. Serving the installed
%   package directly would mean writing scratch files into the installation, so
%   each viewer gets its own temporary copy instead. It is one ~2 MB file copy.

    src = niivue.internal.viewerPage();
    sessionDir = [tempname '_niivue'];
    mkdir(sessionDir);
    copyfile(src, fullfile(sessionDir, 'index.html'));
end
