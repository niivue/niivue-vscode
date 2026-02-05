classdef Component < matlab.ui.componentcontainer.ComponentContainer
    %COMPONENT NiiVue viewer component for App Designer
    %   This component can be added to App Designer apps to embed a
    %   NiiVue viewer with interactive controls.
    %
    %   Example in App Designer:
    %       % In the startup function:
    %       app.NiiVueViewer = niivue.Component(app.UIFigure);
    %       app.NiiVueViewer.Position = [10, 10, 600, 400];
    
    properties (Access = public)
        FilePath char = ''           % Path to NIfTI file to display
        Colormap char = 'gray'       % Colormap name
        Opacity (1,1) double = 1.0   % Volume opacity (0-1)
        CrosshairPos (1,3) double = [0, 0, 0]  % Crosshair position [x, y, z]
    end
    
    properties (Access = private, Transient, NonCopyable)
        HTMLComponent        % uihtml component
        Controller          % Internal controller
        Grid                % Grid layout
    end
    
    events (HasCallbackProperty, NotifyAccess = protected)
        CrosshairChanged    % Fired when crosshair position changes
    end
    
    methods (Access = protected)
        function setup(obj)
            %SETUP Initialize the component
            
            % Create grid layout
            obj.Grid = uigridlayout(obj, [1, 1]);
            obj.Grid.RowHeight = {'1x'};
            obj.Grid.ColumnWidth = {'1x'};
            obj.Grid.Padding = [0, 0, 0, 0];
            
            % Get the path to the HTML viewer
            htmlPath = niivue.Controller.getViewerPath();
            
            % Create uihtml component
            obj.HTMLComponent = uihtml(obj.Grid);
            obj.HTMLComponent.HTMLSource = htmlPath;
            obj.HTMLComponent.Layout.Row = 1;
            obj.HTMLComponent.Layout.Column = 1;
            
            % Set up data change callback
            obj.HTMLComponent.DataChangedFcn = @obj.onDataChanged;
            
            % Wait for initialization
            pause(0.5);
        end
        
        function update(obj)
            %UPDATE Update the component when properties change
            
            % This is called when public properties change
            % Load file if FilePath is set
            if ~isempty(obj.FilePath) && exist(obj.FilePath, 'file')
                obj.loadVolume(obj.FilePath);
            end
        end
    end
    
    methods (Access = private)
        function loadVolume(obj, filepath)
            %LOADVOLUME Load a volume into the viewer
            
            % Read the NIfTI file as binary
            fid = fopen(filepath, 'r');
            if fid == -1
                return;
            end
            data = fread(fid, '*uint8');
            fclose(fid);
            
            % Convert to Base64
            base64Data = matlab.net.base64encode(data);
            
            % Get filename
            [~, name, ext] = fileparts(filepath);
            filename = [name, ext];
            
            % Send to viewer
            msg = struct('type', 'loadVolume', ...
                'payload', struct('data', base64Data, ...
                'name', filename, ...
                'colormap', obj.Colormap, ...
                'opacity', obj.Opacity));
            
            obj.HTMLComponent.Data = msg;
        end
        
        function onDataChanged(obj, ~, ~)
            %ONDATACHANGED Handle messages from the viewer
            
            data = obj.HTMLComponent.Data;
            
            if isfield(data, 'type')
                switch data.type
                    case 'crosshairUpdate'
                        if isfield(data, 'position')
                            obj.CrosshairPos = data.position;
                            % Notify listeners
                            notify(obj, 'CrosshairChanged');
                        end
                end
            end
        end
    end
    
    methods (Access = public)
        function addVolume(obj, filepath, varargin)
            %ADDVOLUME Add a volume to the viewer
            
            p = inputParser;
            addRequired(p, 'filepath', @ischar);
            addParameter(p, 'colormap', obj.Colormap, @ischar);
            addParameter(p, 'opacity', obj.Opacity, @isnumeric);
            parse(p, filepath, varargin{:});
            
            obj.FilePath = filepath;
            obj.Colormap = p.Results.colormap;
            obj.Opacity = p.Results.opacity;
            
            obj.loadVolume(filepath);
        end
        
        function setColormap(obj, colormap, volumeIndex)
            %SETCOLORMAP Set colormap for a volume
            
            if nargin < 3
                volumeIndex = 0;
            else
                volumeIndex = volumeIndex - 1;
            end
            
            obj.Colormap = colormap;
            msg = struct('type', 'setColormap', ...
                'payload', struct('colormap', colormap, 'index', volumeIndex));
            obj.HTMLComponent.Data = msg;
        end
        
        function setCrosshair(obj, x, y, z)
            %SETCROSSHAIR Set crosshair position
            
            msg = struct('type', 'updateCrosshairs', ...
                'payload', struct('x', x, 'y', y, 'z', z));
            obj.HTMLComponent.Data = msg;
            obj.CrosshairPos = [x, y, z];
        end
    end
end
