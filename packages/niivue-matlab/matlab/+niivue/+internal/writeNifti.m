function writeNifti(path, data, voxelSize)
%WRITENIFTI Write a single-file NIfTI-1 (.nii) volume.
%
%   Deliberately dependency-free: niftiwrite lives in the Image Processing
%   Toolbox, and a viewer should not require one. Handles 3D and 4D real
%   arrays; the affine is a plain scaled identity, which is what an array with
%   no header can honestly claim.

    if ndims(data) > 4
        error('niivue:tooManyDims', ...
            'Expected a 3-D or 4-D array, got %d dimensions.', ndims(data));
    end

    switch class(data)
        case {'logical', 'uint8'}, datatype = int16(2);  bitpix = int16(8);  data = uint8(data);
        case 'int16',              datatype = int16(4);  bitpix = int16(16);
        case 'int32',              datatype = int16(8);  bitpix = int16(32);
        case 'single',             datatype = int16(16); bitpix = int16(32);
        case 'double',             datatype = int16(64); bitpix = int16(64);
        case 'uint16',             datatype = int16(512); bitpix = int16(16);
        otherwise
            % Anything else is promoted rather than refused.
            data = single(data);
            datatype = int16(16); bitpix = int16(32);
    end

    sz = size(data);
    sz(end+1:4) = 1;
    nd = 3 + (sz(4) > 1);

    fid = fopen(path, 'w', 'l');
    if fid < 0
        error('niivue:cannotWrite', 'Could not open %s for writing.', path);
    end
    closeFile = onCleanup(@() fclose(fid));

    fwrite(fid, 348, 'int32');                 % sizeof_hdr
    fwrite(fid, zeros(1, 35), 'uint8');        % data_type, db_name, extents, ...
    fwrite(fid, 0, 'uint8');                   % dim_info

    fwrite(fid, [nd sz(1:4) 1 1 1], 'int16');  % dim[0..7]
    fwrite(fid, [0 0 0], 'single');            % intent_p1..p3
    fwrite(fid, 0, 'int16');                   % intent_code
    fwrite(fid, datatype, 'int16');
    fwrite(fid, bitpix, 'int16');
    fwrite(fid, 0, 'int16');                   % slice_start
    fwrite(fid, [1 voxelSize(:)' 1 0 0 0], 'single');  % pixdim[0..7]
    fwrite(fid, 352, 'single');                % vox_offset
    fwrite(fid, 1, 'single');                  % scl_slope
    fwrite(fid, 0, 'single');                  % scl_inter
    fwrite(fid, 0, 'int16');                   % slice_end
    fwrite(fid, 0, 'uint8');                   % slice_code
    fwrite(fid, 10, 'uint8');                  % xyzt_units: mm + sec
    finite = data(isfinite(data));
    if isempty(finite)
        finite = 0;
    end
    fwrite(fid, [double(max(finite(:))) double(min(finite(:)))], 'single'); % cal_max, cal_min
    fwrite(fid, [0 0], 'single');              % slice_duration, toffset
    fwrite(fid, [0 0], 'int32');               % glmax, glmin
    fwrite(fid, zeros(1, 80), 'uint8');        % descrip
    fwrite(fid, zeros(1, 24), 'uint8');        % aux_file

    fwrite(fid, 1, 'int16');                   % qform_code
    fwrite(fid, 1, 'int16');                   % sform_code
    fwrite(fid, [0 0 0], 'single');            % quatern_b, c, d
    fwrite(fid, [0 0 0], 'single');            % qoffset_x, y, z
    % srow: scaled identity, origin at the volume centre so the crosshair opens
    % somewhere sensible rather than at a corner.
    origin = -voxelSize(:)' .* (sz(1:3) - 1) / 2;
    fwrite(fid, [voxelSize(1) 0 0 origin(1)], 'single');
    fwrite(fid, [0 voxelSize(2) 0 origin(2)], 'single');
    fwrite(fid, [0 0 voxelSize(3) origin(3)], 'single');

    fwrite(fid, zeros(1, 16), 'uint8');        % intent_name
    fwrite(fid, ['n+1' char(0)], 'char');      % magic
    fwrite(fid, zeros(1, 4), 'uint8');         % pad to vox_offset 352

    fwrite(fid, data, class(data));
end
