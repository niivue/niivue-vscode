classdef Component < matlab.ui.componentcontainer.ComponentContainer
    %NIIVUE.COMPONENT NiiVue as an App Designer component.
    %
    %   Drop it into an app and drive it through the Viewer underneath:
    %
    %       app.Nv = niivue.Component(app.UIFigure);
    %       app.Nv.Position = [10 10 600 400];
    %       app.Nv.Viewer.addVolume("T1.nii");
    %
    %       addlistener(app.Nv.Viewer, "CrosshairMoved", ...
    %           @(~, e) set(app.Label, "Text", sprintf("%.1f %.1f %.1f mm", e.Millimetres)));
    %
    %   The component owns the viewer's lifetime; everything else lives on
    %   NIIVUE.VIEWER, so there is one API to learn rather than two.

    properties (SetAccess = private)
        %VIEWER The niivue.Viewer driving this component.
        Viewer
    end

    properties (Access = private, Transient, NonCopyable)
        Grid matlab.ui.container.GridLayout
    end

    methods (Access = protected)
        function setup(obj)
            obj.Grid = uigridlayout(obj, [1 1], Padding=[0 0 0 0]);
            obj.Viewer = niivue.Viewer(obj.Grid);
        end

        function update(~)
            % Nothing to mirror: state lives in the viewer, and every setter
            % pushes straight through. A property-driven update() here would
            % reload the volume on every unrelated change.
        end
    end

    methods
        function delete(obj)
            if ~isempty(obj.Viewer) && isvalid(obj.Viewer)
                delete(obj.Viewer);
            end
        end
    end
end
