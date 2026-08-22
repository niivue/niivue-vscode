function files = resolveFiles(spec)
%RESOLVEFILES Turn whatever the user passed into a list of file paths.
%
%   Accepts, in any mixture:
%     "a.nii"                       one path
%     ["a.nii" "b.nii"]             string array
%     {'a.nii', 'b.nii'}            cell array of char
%     "derivatives/*.nii.gz"        wildcard
%     "sub-01/anat"                 a folder (every image inside)
%     dir("*.nii")                  the struct array dir returns
%
%   Wildcards and folders are expanded and sorted, so a loop over subjects
%   comes out in a predictable order.

    if isstruct(spec)
        % dir() output: name + folder
        if ~all(isfield(spec, {'name', 'folder'}))
            error('niivue:badFileSpec', ...
                'A struct input must come from dir(), with name and folder fields.');
        end
        files = string(fullfile({spec.folder}, {spec.name}));
        files = files(~[spec.isdir]);
        return
    end

    spec = string(spec);
    files = strings(1, 0);

    for k = 1:numel(spec)
        item = spec(k);
        if strlength(item) == 0
            continue
        end

        if isfolder(item)
            files = [files, imagesIn(item)]; %#ok<AGROW>
        elseif contains(item, ["*", "?"])
            found = dir(item);
            if isempty(found)
                error('niivue:noMatch', 'Nothing matched "%s".', item);
            end
            matched = string(fullfile({found.folder}, {found.name}));
            files = [files, sort(matched(~[found.isdir]))]; %#ok<AGROW>
        else
            files = [files, item]; %#ok<AGROW>
        end
    end

    if isempty(files)
        error('niivue:noFiles', 'No files to open.');
    end

    missing = files(~isfile(files));
    if ~isempty(missing)
        error('niivue:fileNotFound', 'No such file: %s', missing(1));
    end
end

function out = imagesIn(folder)
    % Extensions NiiVue reads that are worth picking up from a bare folder.
    % Deliberately conservative: a folder of DICOM slices is a series, not a
    % list of images to tile, so it is not swept up here.
    patterns = ["*.nii" "*.nii.gz" "*.mgz" "*.mgh" "*.nrrd" "*.mha" "*.mhd"];
    out = strings(1, 0);
    for p = patterns
        found = dir(fullfile(folder, p));
        if ~isempty(found)
            out = [out, string(fullfile({found.folder}, {found.name}))]; %#ok<AGROW>
        end
    end
    out = sort(out);
end
