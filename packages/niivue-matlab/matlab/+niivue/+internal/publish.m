function ref = publish(sessionDir, src, opts)
%PUBLISH Stage data where the viewer can fetch it.
%
%   ref = PUBLISH(sessionDir, filepath) copies an existing file.
%   ref = PUBLISH(sessionDir, array, VoxelSize=..., Name=...) writes a NIfTI.
%
%   Returns a struct with `url` (relative, for the page) and `name` (the real
%   filename, which is what NiiVue picks its reader from).
%
%   Everything is staged with a .bin extension because MATLAB's static route
%   serves only an allowlist: .bin and .json return 200, while .nii, .nii.gz
%   and .dat return 404. The true name travels separately in the message.

    arguments
        sessionDir (1,1) string
        src
        opts.Name (1,1) string = ""
        opts.VoxelSize (1,3) double = [1 1 1]
    end

    persistent counter
    if isempty(counter)
        counter = 0;
    end
    counter = counter + 1;
    stem = sprintf('d%06d', counter);
    dst = fullfile(sessionDir, [stem '.bin']);

    if isstring(src) || ischar(src)
        srcPath = char(src);
        if ~isfile(srcPath)
            error('niivue:fileNotFound', 'No such file: %s', srcPath);
        end
        [~, base, ext] = fileparts(srcPath);
        name = [base ext];
        % .nii.gz loses its first extension to fileparts; put it back.
        if strcmpi(ext, '.gz')
            [~, b2, e2] = fileparts(base);
            if ~isempty(e2)
                name = [b2 e2 ext];
            end
        end
        copyfile(srcPath, dst);
    elseif isnumeric(src) || islogical(src)
        name = 'volume.nii';
        if strlength(opts.Name) > 0
            name = char(opts.Name);
        end
        niivue.internal.writeNifti(dst, src, opts.VoxelSize);
    else
        error('niivue:unsupportedInput', ...
            ['Expected a file path or a numeric array, got %s. ' ...
             'To display an spm_vol struct, pass its .fname.'], class(src));
    end

    if strlength(opts.Name) > 0
        name = char(opts.Name);
    end
    ref = struct('url', [stem '.bin'], 'name', name);
end
