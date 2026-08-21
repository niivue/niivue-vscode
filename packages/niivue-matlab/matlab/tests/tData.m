classdef tData < matlab.unittest.TestCase
    %TDATA Unit tests for the data path. No viewer, no display required.

    properties
        TempDir
    end

    methods (TestMethodSetup)
        function makeTempDir(tc)
            tc.TempDir = [tempname '_tdata'];
            mkdir(tc.TempDir);
            tc.addTeardown(@() rmdir(tc.TempDir, 's'));
        end
    end

    methods (Test)
        function writesReadableNiftiHeader(tc)
            % A NIfTI-1 single file must start with sizeof_hdr 348 and carry
            % the "n+1" magic at offset 344.
            p = fullfile(tc.TempDir, 'v.nii');
            niivue.internal.writeNifti(p, int16(zeros(4, 5, 6)), [2 2 2]);

            fid = fopen(p, 'r', 'l');
            tc.addTeardown(@() fclose(fid));
            tc.verifyEqual(fread(fid, 1, 'int32'), 348, 'sizeof_hdr must be 348');

            fseek(fid, 344, 'bof');
            tc.verifyEqual(char(fread(fid, 3, 'uint8')'), 'n+1', 'magic must be n+1');
        end

        function writesCorrectDimsAndVoxelSize(tc)
            p = fullfile(tc.TempDir, 'v.nii');
            niivue.internal.writeNifti(p, single(zeros(7, 8, 9)), [1.5 2 2.5]);

            fid = fopen(p, 'r', 'l');
            tc.addTeardown(@() fclose(fid));
            fseek(fid, 40, 'bof');
            dim = fread(fid, 8, 'int16');
            tc.verifyEqual(dim(1), 3, 'rank should be 3 for a 3-D array');
            tc.verifyEqual(dim(2:4)', [7 8 9], 'dims must match the array');

            fseek(fid, 76, 'bof');
            pixdim = fread(fid, 8, 'single');
            tc.verifyEqual(pixdim(2:4)', [1.5 2 2.5], 'AbsTol', 1e-6);
        end

        function roundTripsVoxelData(tc)
            p = fullfile(tc.TempDir, 'v.nii');
            data = int16(reshape(1:60, 3, 4, 5));
            niivue.internal.writeNifti(p, data, [1 1 1]);

            fid = fopen(p, 'r', 'l');
            tc.addTeardown(@() fclose(fid));
            fseek(fid, 352, 'bof');
            back = fread(fid, numel(data), 'int16');
            tc.verifyEqual(reshape(back, size(data)), double(data));
        end

        function marks4dVolumesAsRank4(tc)
            p = fullfile(tc.TempDir, 'v.nii');
            niivue.internal.writeNifti(p, single(zeros(3, 3, 3, 5)), [1 1 1]);
            fid = fopen(p, 'r', 'l');
            tc.addTeardown(@() fclose(fid));
            fseek(fid, 40, 'bof');
            dim = fread(fid, 8, 'int16');
            tc.verifyEqual(dim(1), 4);
            tc.verifyEqual(dim(5), 5, 'the 4th dimension must carry the frame count');
        end

        function rejectsFiveDimensionalInput(tc)
            p = fullfile(tc.TempDir, 'v.nii');
            tc.verifyError(@() niivue.internal.writeNifti(p, zeros(2,2,2,2,2), [1 1 1]), ...
                'niivue:tooManyDims');
        end

        function publishStagesFilesAsBin(tc)
            % The static route serves an allowlist; .nii and .nii.gz 404, so
            % everything is staged as .bin with the real name carried alongside.
            src = fullfile(tc.TempDir, 'brain.nii.gz');
            fid = fopen(src, 'w'); fwrite(fid, uint8(1:10)); fclose(fid);

            ref = niivue.internal.publish(tc.TempDir, src);
            tc.verifyTrue(endsWith(ref.url, '.bin'), 'staged file must be .bin');
            tc.verifyEqual(ref.name, 'brain.nii.gz', ...
                'the real filename must survive: NiiVue picks its reader from it');
            tc.verifyTrue(isfile(fullfile(tc.TempDir, ref.url)));
        end

        function publishWritesArraysAsNifti(tc)
            ref = niivue.internal.publish(tc.TempDir, single(zeros(4,4,4)), VoxelSize=[3 3 3]);
            tc.verifyEqual(ref.name, 'volume.nii');
            fid = fopen(fullfile(tc.TempDir, ref.url), 'r', 'l');
            tc.addTeardown(@() fclose(fid));
            tc.verifyEqual(fread(fid, 1, 'int32'), 348);
        end

        function publishRejectsUnknownInput(tc)
            tc.verifyError(@() niivue.internal.publish(tc.TempDir, {1, 2}), ...
                'niivue:unsupportedInput');
        end

        function publishReportsMissingFileClearly(tc)
            tc.verifyError(@() niivue.internal.publish(tc.TempDir, "no-such-file.nii"), ...
                'niivue:fileNotFound');
        end

        function viewerPageResolves(tc)
            % Guards the packaging layout: the class must find dist/index.html
            % from wherever it is installed.
            p = niivue.internal.viewerPage();
            tc.verifyTrue(isfile(p));
            tc.verifyTrue(endsWith(p, 'index.html'));
        end
    end
end
