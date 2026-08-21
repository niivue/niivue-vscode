function assertSupported()
%ASSERTSUPPORTED Fail early, and in plain language, on unsupported sessions.
%
%   The floor is R2023a, set by sendEventToHTMLSource. Everything else the
%   viewer needs exists earlier, but that call is what gives the bridge
%   individually queued messages and call/response; without it a viewer would
%   silently drop commands.

    persistent checked
    if ~isempty(checked)
        return
    end

    if ~usejava('desktop') && ~usejava('jvm')
        error('niivue:noDisplay', ...
            ['NiiVue needs a graphical MATLAB session. This one has no display ' ...
             '(started with -nodisplay or -nojvm).']);
    end

    if isMATLABReleaseOlderThan("R2023a")
        error('niivue:unsupportedRelease', ...
            ['NiiVue for MATLAB requires R2023a or newer; this is %s.\n\n' ...
             'R2023a introduced sendEventToHTMLSource, which the viewer uses to ' ...
             'talk to MATLAB. Older releases only offer a single shared property ' ...
             'that silently drops commands sent back to back.'], matlabRelease.Release);
    end

    checked = true;
end
