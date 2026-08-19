classdef Controller < handle
    %CONTROLLER Handle class for programmatic NiiVue control
    %   This class provides a MATLAB interface to control a NiiVue viewer
    %   instance embedded in a uifigure using the uihtml component.
    %
    %   Example:
    %       nv = niivue.Controller();
    %       nv.addVolume('T1.nii');
    %       nv.setColormap('gray');
    
    properties (Access = public)
        Figure          % uifigure handle
        HTMLComponent   % uihtml component handle
        CrosshairPos    % Current crosshair position [x, y, z]
    end
    
    properties (Access = private)
        ViewerReady = false
        MessageQueue = {}
    end
    
    methods
        function obj = Controller(parentFigure)
            %CONTROLLER Construct a new NiiVue controller
            %   obj = niivue.Controller() creates a new figure
            %   obj = niivue.Controller(fig) uses existing figure
            
            if nargin < 1 || isempty(parentFigure)
                % Create new figure
                obj.Figure = uifigure('Name', 'NiiVue Viewer', ...
                    'Position', [100, 100, 800, 600]);
            else
                obj.Figure = parentFigure;
            end
            
            % Get the path to the HTML viewer
            htmlPath = niivue.Controller.getViewerPath();
            
            % Create uihtml component
            obj.HTMLComponent = uihtml(obj.Figure, ...
                'Position', [0, 0, obj.Figure.Position(3), obj.Figure.Position(4)], ...
                'HTMLSource', htmlPath);
            
            % Set up listener for data changes from the viewer
            obj.HTMLComponent.DataChangedFcn = @obj.onDataChanged;
            
            % Handle figure resize. SizeChangedFcn is ignored while
            % AutoResizeChildren is 'on', which is the uifigure default, so
            % turn it off first. The uihtml fills the figure and onResize is
            % what keeps it filling it.
            obj.Figure.AutoResizeChildren = 'off';
            obj.Figure.SizeChangedFcn = @(~,~) obj.onResize();
            
            % Wait for viewer to be ready (with timeout). The viewer is a
            % ~2 MB single-file bundle, so a cold CEF start costs a few
            % seconds before window.setup runs. Messages sent meanwhile are
            % queued and flushed on viewerReady, so overshooting only costs
            % the warning below.
            timeout = 15;
            startTime = tic;
            while ~obj.ViewerReady && toc(startTime) < timeout
                pause(0.1);
            end
            
            if ~obj.ViewerReady
                warning('Viewer initialization timed out. Some operations may fail.');
            end
        end
        
        function obj = addVolume(obj, filepath, varargin)
            %ADDVOLUME Load a NIfTI volume into the viewer
            %   obj.addVolume(filepath) loads the volume
            %   obj.addVolume(filepath, 'colormap', 'gray') sets colormap
            %   obj.addVolume(filepath, 'opacity', 0.5) sets opacity
            
            p = inputParser;
            addRequired(p, 'filepath', @ischar);
            addParameter(p, 'colormap', '', @ischar);
            addParameter(p, 'opacity', 1.0, @isnumeric);
            parse(p, filepath, varargin{:});
            
            % Read the NIfTI file as binary
            fid = fopen(filepath, 'r');
            if fid == -1
                error('Cannot open file: %s', filepath);
            end
            data = fread(fid, '*uint8');
            fclose(fid);
            
            % Convert to Base64
            base64Data = matlab.net.base64encode(data);
            
            % Get filename
            [~, name, ext] = fileparts(filepath);
            filename = [name, ext];
            
            % Prepare message
            msg = struct('type', 'loadVolume', ...
                'payload', struct('data', base64Data, ...
                'name', filename));
            
            if ~isempty(p.Results.colormap)
                msg.payload.colormap = p.Results.colormap;
            end
            if p.Results.opacity ~= 1.0
                msg.payload.opacity = p.Results.opacity;
            end
            
            % Send to viewer
            obj.sendMessage(msg);
        end
        
        function obj = setColormap(obj, colormap, volumeIndex)
            %SETCOLORMAP Set the colormap for a volume
            %   obj.setColormap('gray') sets colormap for first volume
            %   obj.setColormap('gray', 2) sets colormap for volume index 2
            
            if nargin < 3
                volumeIndex = 0; % First volume (0-indexed)
            else
                volumeIndex = volumeIndex - 1; % Convert to 0-indexed
            end
            
            msg = struct('type', 'setColormap', ...
                'payload', struct('colormap', colormap, 'index', volumeIndex));
            obj.sendMessage(msg);
        end
        
        function obj = setOpacity(obj, opacity, volumeIndex)
            %SETOPACITY Set the opacity for a volume
            %   obj.setOpacity(0.5) sets opacity for first volume
            %   obj.setOpacity(0.5, 2) sets opacity for volume index 2
            
            if nargin < 3
                volumeIndex = 0; % First volume (0-indexed)
            else
                volumeIndex = volumeIndex - 1; % Convert to 0-indexed
            end
            
            msg = struct('type', 'setOpacity', ...
                'payload', struct('opacity', opacity, 'index', volumeIndex));
            obj.sendMessage(msg);
        end
        
        function obj = addMesh(obj, filepath)
            %ADDMESH Load a mesh file into the viewer
            %   obj.addMesh('mesh.obj') loads the mesh
            
            % Read the mesh file as binary
            fid = fopen(filepath, 'r');
            if fid == -1
                error('Cannot open file: %s', filepath);
            end
            data = fread(fid, '*uint8');
            fclose(fid);
            
            % Convert to Base64
            base64Data = matlab.net.base64encode(data);
            
            % Get filename
            [~, name, ext] = fileparts(filepath);
            filename = [name, ext];
            
            % Prepare and send message
            msg = struct('type', 'addMesh', ...
                'payload', struct('data', base64Data, 'name', filename));
            obj.sendMessage(msg);
        end
        
        function obj = setCrosshair(obj, x, y, z)
            %SETCROSSHAIR Set the crosshair position
            %   obj.setCrosshair(x, y, z) sets crosshair to [x, y, z]
            
            msg = struct('type', 'updateCrosshairs', ...
                'payload', struct('x', x, 'y', y, 'z', z));
            obj.sendMessage(msg);
            obj.CrosshairPos = [x, y, z];
        end
        
        function obj = setSliceType(obj, sliceType)
            %SETSLICETYPE Set the slice display type
            %   obj.setSliceType(3) sets to multiplanar view
            %   Slice types: 0=axial, 1=coronal, 2=sagittal, 3=multiplanar, 4=render
            
            msg = struct('type', 'setSliceType', ...
                'payload', struct('sliceType', sliceType));
            obj.sendMessage(msg);
        end
        
        function obj = clear(obj)
            %CLEAR Clear all volumes from the viewer
            
            msg = struct('type', 'clearVolumes', 'payload', struct());
            obj.sendMessage(msg);
        end
        
        function delete(obj)
            %DELETE Destructor - clean up figure if we created it
            if isvalid(obj.Figure)
                delete(obj.Figure);
            end
        end
    end
    
    methods (Access = private)
        function sendMessage(obj, msg)
            %SENDMESSAGE Send a message to the viewer
            %   Writes coalesce: HTMLComponent.Data is one shared property
            %   flushed to the browser when MATLAB yields, so two commands
            %   issued back to back deliver only the second. drawnow forces
            %   the flush, which is what makes consecutive calls such as
            %   addVolume(a); addVolume(b) both arrive.
            
            if obj.ViewerReady
                obj.HTMLComponent.Data = msg;
                drawnow
            else
                % Queue message until viewer is ready
                obj.MessageQueue{end+1} = msg;
            end
        end
        
        function onDataChanged(obj, ~, event)
            %ONDATACHANGED Handle messages from the viewer
            
            data = obj.HTMLComponent.Data;
            
            if isfield(data, 'type')
                switch data.type
                    case 'viewerReady'
                        obj.ViewerReady = true;
                        % Send queued messages. Take the queue first: the
                        % drawnow below re-enters this callback, and a
                        % reentrant call must not replay the same backlog.
                        queued = obj.MessageQueue;
                        obj.MessageQueue = {};
                        for i = 1:numel(queued)
                            obj.HTMLComponent.Data = queued{i};
                            drawnow
                        end
                        
                    case 'crosshairUpdate'
                        if isfield(data, 'position')
                            obj.CrosshairPos = data.position;
                        end
                        
                    case 'error'
                        warning('NiiVue error: %s', data.message);
                end
            end
        end
        
        function onResize(obj)
            %ONRESIZE Handle figure resize
            if isvalid(obj.HTMLComponent)
                obj.HTMLComponent.Position = [0, 0, obj.Figure.Position(3), obj.Figure.Position(4)];
            end
        end
    end
    
    methods (Static)
        function htmlPath = getViewerPath()
            %GETVIEWERPATH Get the path to the HTML viewer
            
            % Get the directory of this class file
            classPath = fileparts(mfilename('fullpath'));
            
            % Look for the HTML file in the parent matlab directory
            htmlPath = fullfile(classPath, '..', '..', 'dist', 'index.html');
            
            if ~exist(htmlPath, 'file')
                error('NiiVue viewer HTML file not found at: %s', htmlPath);
            end
        end
    end
end
