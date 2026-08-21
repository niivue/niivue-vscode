classdef (ConstructOnLoad) VolumeEvent < event.EventData
    %NIIVUE.VOLUMEEVENT Data for the VolumeLoaded event.

    properties
        %Index 1-based position of the volume in the stack.
        Index (1,1) double
        %Name Filename the volume was loaded from.
        Name (1,1) string
        %Info Full descriptor: dims, pixDims, window, colormap.
        Info
    end

    methods
        function obj = VolumeEvent(payload)
            obj.Index = double(payload.index);
            obj.Name = string(payload.name);
            obj.Info = payload;
        end
    end
end
