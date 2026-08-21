classdef (ConstructOnLoad) CrosshairEvent < event.EventData
    %NIIVUE.CROSSHAIREVENT Data for the CrosshairMoved event.

    properties
        %MILLIMETRES Cursor position in world mm, [x y z].
        Millimetres (1,3) double
        %Voxel Nearest voxel index of the first volume, [i j k], or empty.
        Voxel double
        %Values Struct array of per-volume intensities at the cursor.
        Values
    end

    methods
        function obj = CrosshairEvent(payload)
            obj.Millimetres = double(payload.mm(:)');
            if isfield(payload, 'vox') && ~isempty(payload.vox)
                obj.Voxel = double(payload.vox(:)');
            else
                obj.Voxel = [];
            end
            if isfield(payload, 'values')
                obj.Values = payload.values;
            else
                obj.Values = struct([]);
            end
        end
    end
end
