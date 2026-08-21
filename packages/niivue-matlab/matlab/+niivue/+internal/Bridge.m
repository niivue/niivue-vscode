classdef Bridge < handle
    %BRIDGE Transport between MATLAB and the NiiVue page. Internal.
    %
    %   Control messages use the uihtml event channel. The Data property is
    %   deliberately unused: it is a single shared slot that flushes only when
    %   MATLAB yields, so back-to-back writes coalesce and all but the last are
    %   lost. Events queue individually and carry a correlation id, which is
    %   what allows call/response - and therefore getters - at all.
    %
    %   Volume bytes go through the filesystem. Each Bridge owns a session
    %   folder holding a copy of the viewer page; MATLAB writes data files
    %   beside it and the page fetches them from MATLAB's own connector at
    %   roughly 70 MB/s. Base64 through a property manages about 1 MB/s.

    properties (SetAccess = private)
        Html            % the uihtml component
        SessionDir      % folder served to the page
        Ready = false
    end

    properties (Access = private)
        NextId = 0
        Pending             % containers.Map: id -> result struct
        Listeners = {}      % {name, function_handle}
        Cleanup
    end

    properties
        Timeout = 30        % seconds to wait for any single call
    end

    methods
        function obj = Bridge(parent, position)
            obj.Pending = containers.Map('KeyType', 'double', 'ValueType', 'any');
            obj.SessionDir = niivue.internal.stageViewer();
            % Capture the path, not obj: an anonymous function holding obj would
            % dereference an already-deleted handle when the destructor runs.
            sessionDir = obj.SessionDir;
            obj.Cleanup = onCleanup(@() niivue.internal.removeDir(sessionDir));

            page = fullfile(obj.SessionDir, 'index.html');
            obj.Html = uihtml(parent, 'HTMLSource', page);
            if nargin > 1 && ~isempty(position)
                obj.Html.Position = position;
            end
            obj.Html.HTMLEventReceivedFcn = @(~, e) obj.onEvent(e);

            obj.waitForReady();
        end

        function addListener(obj, name, fcn)
            %ADDLISTENER Register a handler for a viewer event by name.
            obj.Listeners{end+1} = {name, fcn};
        end

        function value = call(obj, method, params)
            %CALL Invoke a viewer method and return its result.
            if nargin < 3
                params = struct();
            end
            obj.NextId = obj.NextId + 1;
            id = obj.NextId;
            msg = struct('id', id, 'method', method, 'params', params);
            sendEventToHTMLSource(obj.Html, 'nvcall', msg);

            t = tic;
            while ~obj.Pending.isKey(id)
                if toc(t) > obj.Timeout
                    error('niivue:timeout', ...
                        ['The viewer did not answer "%s" within %g s. If the ' ...
                         'window was closed, create a new viewer.'], method, obj.Timeout);
                end
                drawnow          % never drawnow limitrate: it caps flushing at
                pause(0.001)     % 20 Hz and turns a 13 ms round trip into 155 ms
            end
            res = obj.Pending(id);
            obj.Pending.remove(id);

            if ~res.ok
                error('niivue:viewerError', '%s', res.error);
            end
            value = res.value;
        end

        function post(obj, method, params)
            %POST Fire and forget. Still ordered, still delivered.
            if nargin < 3
                params = struct();
            end
            obj.NextId = obj.NextId + 1;
            sendEventToHTMLSource(obj.Html, 'nvcall', ...
                struct('id', obj.NextId, 'method', method, 'params', params));
        end

        function tf = isAlive(obj)
            tf = ~isempty(obj.Html) && isvalid(obj.Html);
        end
    end

    methods (Access = private)
        function waitForReady(obj)
            t = tic;
            while ~obj.Ready && toc(t) < obj.Timeout
                drawnow
                pause(0.001)
            end
            if ~obj.Ready
                error('niivue:startupTimeout', ...
                    ['The NiiVue page did not start within %g s. This usually ' ...
                     'means the viewer bundle is missing or the embedded browser ' ...
                     'could not create a WebGL context. Run niivue.diagnose for ' ...
                     'details.'], obj.Timeout);
            end
        end

        function onEvent(obj, e)
            d = e.HTMLEventData;
            switch e.HTMLEventName
                case 'nvresult'
                    obj.Pending(d.id) = d;
                case 'nvevent'
                    if strcmp(d.name, 'ready')
                        obj.Ready = true;
                        return
                    end
                    for k = 1:numel(obj.Listeners)
                        if strcmp(obj.Listeners{k}{1}, d.name)
                            obj.Listeners{k}{2}(d.payload);
                        end
                    end
            end
        end
    end
end
