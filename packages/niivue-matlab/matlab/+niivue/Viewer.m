classdef Viewer < handle
    %NIIVUE.VIEWER Interactive 3-D medical image viewer in a MATLAB figure.
    %
    %   v = niivue.Viewer() opens an empty viewer.
    %   v = niivue.Viewer(parent) embeds it in an existing uifigure or panel.
    %
    %   Coordinates are world millimetres throughout, matching the image
    %   header. Volume indices are 1-based, matching MATLAB.
    %
    %   Example:
    %       v = niivue.Viewer;
    %       v.addVolume("T1.nii");
    %       v.addVolume("spmT_0001.nii", Colormap="hot", Threshold=[3.1 8]);
    %       v.Crosshair = [40 -22 52];
    %       addlistener(v, "CrosshairMoved", @(~, e) disp(e.Millimetres));
    %
    %   See also NIIVUE.SHOW, NIIVUE.CHECKREG, NIIVUE.DIAGNOSE.

    properties (Dependent)
        %CROSSHAIR Cursor position in world millimetres, [x y z].
        Crosshair (1,3) double

        %LAYOUT One of "axial", "coronal", "sagittal", "multiplanar", "render".
        Layout (1,1) string
    end

    properties (SetAccess = private)
        %FIGURE The figure holding the viewer.
        Figure
    end

    properties (Access = private)
        Bridge
        OwnsFigure = false
        LayoutCache = "multiplanar"
    end

    events
        %CROSSHAIRMOVED Fires when the cursor moves, from any cause.
        CrosshairMoved
        %VOLUMELOADED Fires when a volume finishes loading.
        VolumeLoaded
    end

    methods
        function obj = Viewer(parent, opts)
            arguments
                parent = []
                opts.Name (1,1) string = "NiiVue"
                opts.Position (1,4) double = [100 100 900 700]
            end

            niivue.internal.assertSupported();

            if isempty(parent)
                obj.Figure = uifigure(Name=opts.Name, Position=opts.Position);
                obj.Figure.AutoResizeChildren = 'off';
                obj.OwnsFigure = true;
                container = obj.Figure;
                pos = [0 0 opts.Position(3) opts.Position(4)];
                obj.Figure.SizeChangedFcn = @(~, ~) obj.fitToFigure();
            else
                container = parent;
                obj.Figure = ancestor(parent, 'figure');
                pos = [];
            end

            obj.Bridge = niivue.internal.Bridge(container, pos);
            obj.Bridge.addListener('crosshairMoved', @(p) obj.onCrosshair(p));
            obj.Bridge.addListener('volumeLoaded',  @(p) obj.onVolumeLoaded(p));
        end

        function info = addVolume(obj, src, opts)
            %ADDVOLUME Load a volume from a file or a workspace array.
            %
            %   v.addVolume("T1.nii")
            %   v.addVolume("stat.nii", Colormap="hot", Threshold=[3.1 8])
            %   v.addVolume(Y, VoxelSize=[2 2 2])
            %
            %   Threshold sets the displayed intensity window; values below the
            %   lower bound are transparent, which is what you want for a
            %   statistical map laid over an anatomical.
            arguments
                obj
                src
                opts.Colormap (1,1) string = ""
                opts.Opacity (1,1) double {mustBeInRange(opts.Opacity, 0, 1)} = 1
                opts.Threshold (1,2) double = [NaN NaN]
                opts.Name (1,1) string = ""
                opts.VoxelSize (1,3) double = [1 1 1]
            end
            obj.assertAlive();

            ref = niivue.internal.publish(obj.Bridge.SessionDir, src, ...
                Name=opts.Name, VoxelSize=opts.VoxelSize);

            params = struct('url', ref.url, 'name', ref.name, 'opacity', opts.Opacity);
            if strlength(opts.Colormap) > 0
                params.colormap = char(opts.Colormap);
            end
            if all(isfinite(opts.Threshold))
                params.calMin = opts.Threshold(1);
                params.calMax = opts.Threshold(2);
            end

            info = obj.Bridge.call('loadVolume', params);
        end

        function info = addMesh(obj, src, opts)
            %ADDMESH Load a surface mesh (.gii, .mz3, FreeSurfer, .obj, ...).
            arguments
                obj
                src
                opts.Name (1,1) string = ""
            end
            obj.assertAlive();
            ref = niivue.internal.publish(obj.Bridge.SessionDir, src, Name=opts.Name);
            info = obj.Bridge.call('loadMesh', struct('url', ref.url, 'name', ref.name));
        end

        function setVolume(obj, index, opts)
            %SETVOLUME Change how an already-loaded volume is displayed.
            %
            %   v.setVolume(2, Colormap="cool", Opacity=0.6)
            arguments
                obj
                index (1,1) double {mustBeInteger, mustBePositive}
                opts.Colormap (1,1) string = ""
                opts.Opacity (1,1) double {mustBeInRange(opts.Opacity, 0, 1)} = NaN
                opts.Threshold (1,2) double = [NaN NaN]
            end
            obj.assertAlive();
            params = struct('index', index);
            if strlength(opts.Colormap) > 0
                params.colormap = char(opts.Colormap);
            end
            if isfinite(opts.Opacity)
                params.opacity = opts.Opacity;
            end
            if all(isfinite(opts.Threshold))
                params.calMin = opts.Threshold(1);
                params.calMax = opts.Threshold(2);
            end
            obj.Bridge.call('setVolumeOptions', params);
        end

        function removeVolume(obj, index)
            %REMOVEVOLUME Remove one volume by 1-based index.
            arguments
                obj
                index (1,1) double {mustBeInteger, mustBePositive}
            end
            obj.assertAlive();
            obj.Bridge.call('removeVolume', struct('index', index));
        end

        function clear(obj)
            %CLEAR Remove every loaded volume.
            obj.assertAlive();
            obj.Bridge.call('clear');
        end

        function n = numVolumes(obj)
            %NUMVOLUMES Number of loaded volumes.
            obj.assertAlive();
            c = obj.Bridge.call('count');
            n = c.volumes;
        end

        function info = volumeInfo(obj, index)
            %VOLUMEINFO Dimensions, voxel size, window and colormap of a volume.
            arguments
                obj
                index (1,1) double {mustBeInteger, mustBePositive} = 1
            end
            obj.assertAlive();
            info = obj.Bridge.call('getVolumeInfo', struct('index', index));
        end

        function values = intensityAt(obj, mm)
            %INTENSITYAT Voxel values of every loaded volume at a world point.
            %
            %   values = v.intensityAt([40 -22 52])
            arguments
                obj
                mm (1,3) double
            end
            obj.assertAlive();
            loc = obj.Bridge.call('setCrosshair', struct('mm', mm));
            values = loc.values;
        end

        function setFrame(obj, frame, index)
            %SETFRAME Show a given volume of a 4-D series (1-based).
            arguments
                obj
                frame (1,1) double {mustBeInteger, mustBePositive}
                index (1,1) double {mustBeInteger, mustBePositive} = 1
            end
            obj.assertAlive();
            obj.Bridge.call('setFrame', struct('index', index, 'frame', frame));
        end

        function set(obj, opts)
            %SET Toggle viewer chrome.
            %
            %   v.set(Colorbar=true, Crosshair=false, Radiological=true)
            arguments
                obj
                opts.Colorbar (1,1) logical = false
                opts.Crosshair (1,1) logical = true
                opts.Radiological (1,1) logical = false
            end
            obj.assertAlive();
            obj.Bridge.call('setOptions', struct( ...
                'colorbar', opts.Colorbar, ...
                'crosshairVisible', opts.Crosshair, ...
                'radiological', opts.Radiological));
        end

        function img = snapshot(obj, filename)
            %SNAPSHOT Capture the rendered view as an RGB image.
            %
            %   img = v.snapshot();          returns a uint8 H-by-W-by-3 array
            %   v.snapshot("figure.png");    writes a file
            %
            %   MATLAB's own print and exportapp capture the web view as solid
            %   black, because the GPU-composited surface is not in their path.
            %   This asks the viewer to render its own bitmap and sends the
            %   bytes back, so the result works with imwrite, imshow and print.
            arguments
                obj
                filename (1,1) string = ""
            end
            obj.assertAlive();
            res = obj.Bridge.call('snapshot');
            bytes = matlab.net.base64decode(res.png);
            tmp = [tempname '.png'];
            fid = fopen(tmp, 'w');
            fwrite(fid, bytes, 'uint8');
            fclose(fid);
            img = imread(tmp);
            delete(tmp);
            if strlength(filename) > 0
                imwrite(img, filename);
            end
            if nargout == 0
                clear img
            end
        end

        %-- property access ------------------------------------------------

        function v = get.Crosshair(obj)
            obj.assertAlive();
            loc = obj.Bridge.call('getCrosshair');
            v = double(loc.mm(:)');
        end

        function set.Crosshair(obj, mm)
            obj.assertAlive();
            obj.Bridge.call('setCrosshair', struct('mm', mm));
        end

        function v = get.Layout(obj)
            v = obj.LayoutCache;
        end

        function set.Layout(obj, value)
            allowed = ["axial" "coronal" "sagittal" "multiplanar" "render"];
            value = lower(string(value));
            if ~ismember(value, allowed)
                error('niivue:badLayout', ...
                    'Layout must be one of: %s', strjoin(allowed, ', '));
            end
            obj.assertAlive();
            obj.Bridge.call('setLayout', struct('layout', char(value)));
            obj.LayoutCache = value;
        end

        function delete(obj)
            if obj.OwnsFigure && ~isempty(obj.Figure) && isvalid(obj.Figure)
                delete(obj.Figure);
            end
        end
    end

    methods (Access = private)
        function assertAlive(obj)
            if isempty(obj.Bridge) || ~obj.Bridge.isAlive()
                error('niivue:closed', ...
                    'This viewer has been closed. Create a new one with niivue.Viewer.');
            end
        end

        function fitToFigure(obj)
            if obj.Bridge.isAlive() && isvalid(obj.Figure)
                p = obj.Figure.Position;
                obj.Bridge.Html.Position = [0 0 p(3) p(4)];
            end
        end

        function onCrosshair(obj, payload)
            notify(obj, 'CrosshairMoved', niivue.CrosshairEvent(payload));
        end

        function onVolumeLoaded(obj, payload)
            notify(obj, 'VolumeLoaded', niivue.VolumeEvent(payload));
        end
    end
end
