classdef tViewer < matlab.unittest.TestCase
    %TVIEWER End-to-end tests against a real viewer.
    %
    %   These open a uifigure, run the embedded browser and exercise the bridge
    %   in both directions. They are skipped, not failed, on a session that
    %   cannot host one - use niivue.diagnose to see why.

    properties
        Viewer
        Fixture
    end

    methods (TestClassSetup)
        function openSharedViewer(tc)
            tc.assumeFalse(isMATLABReleaseOlderThan("R2023a"), ...
                'Needs R2023a for sendEventToHTMLSource.');
            tc.assumeTrue(usejava('jvm'), 'Needs a graphical session.');
            try
                niivue.internal.viewerPage();
            catch
                tc.assumeFail('Viewer bundle not built: pnpm --filter @niivue/matlab build');
            end

            tc.Fixture = fullfile(fileparts(mfilename('fullpath')), 'fixtures', 'phantom.nii');
            if ~isfile(tc.Fixture)
                d = fileparts(tc.Fixture);
                if ~exist(d, 'dir'), mkdir(d); end
                % Asymmetric on every axis, so an axis mix-up shows up as a
                % wrong intensity rather than quietly passing.
                [x, y, z] = ndgrid(1:12, 1:14, 1:16);
                niivue.internal.writeNifti(tc.Fixture, int16(x + 100*y + 10000*z), [2 2 2]);
            end

            % One viewer for the whole class. Starting one costs about ten
            % seconds - a 2 MB bundle, a browser and a GPU device - so a fresh
            % viewer per test would spend minutes doing nothing but booting.
            try
                tc.Viewer = niivue.Viewer(Name="niivue tests");
            catch err
                tc.assumeFail(sprintf( ...
                    'This session cannot host the viewer (%s). Run niivue.diagnose.', ...
                    err.identifier));
            end
            tc.addTeardown(@() delete(tc.Viewer));
        end
    end

    methods (TestMethodSetup)
        function resetViewer(tc)
            % Cheap compared with a new viewer, and enough: clear drops every
            % volume and the layout is the only other sticky bit of state.
            tc.Viewer.clear();
            tc.Viewer.Layout = "multiplanar";
        end
    end

    methods (Access = private)
        function files = threeFixtures(tc)
            d = fullfile(fileparts(tc.Fixture), 'multi');
            if ~exist(d, 'dir'), mkdir(d); end
            names = ["one.nii" "two.nii" "three.nii"];
            files = strings(1, 3);
            for k = 1:3
                files(k) = fullfile(d, names(k));
                if ~isfile(files(k))
                    niivue.internal.writeNifti(files(k), ...
                        int16(k * reshape(1:(5*6*7), 5, 6, 7)), [2 2 2]);
                end
            end
        end
    end

    methods (Test)
        function opensAndReportsNoVolumes(tc)
            tc.verifyEqual(tc.Viewer.numVolumes(), 0);
        end

        function loadsAVolumeAndReturnsItsShape(tc)
            info = tc.Viewer.addVolume(tc.Fixture);
            tc.verifyEqual(double(info.index), 1);
            tc.verifyEqual(double(info.dims(1:3)), [12 14 16], ...
                'dimensions must survive the file handoff');
            tc.verifyEqual(tc.Viewer.numVolumes(), 1);
        end

        function consecutiveCallsAllArrive(tc)
            % The regression that motivated the event channel: with the old
            % shared-property transport, back-to-back commands coalesced and
            % every one but the last was silently dropped.
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.addVolume(tc.Fixture);
            tc.verifyEqual(tc.Viewer.numVolumes(), 3, ...
                'three loads must produce three volumes');
        end

        function crosshairRoundTripsInMillimetres(tc)
            tc.Viewer.addVolume(tc.Fixture);
            target = [4 -6 8];
            tc.Viewer.Crosshair = target;
            tc.verifyEqual(tc.Viewer.Crosshair, target, 'AbsTol', 0.5, ...
                'the crosshair is world mm in both directions');
        end

        function crosshairAcceptsNegativeAndLargeCoordinates(tc)
            % Distinguishes world mm from a [0 1] scene fraction: a fraction
            % could not represent either of these.
            tc.Viewer.addVolume(tc.Fixture);
            for target = {[-12 6 -4], [10 12 14]}
                tc.Viewer.Crosshair = target{1};
                tc.verifyEqual(tc.Viewer.Crosshair, target{1}, 'AbsTol', 0.5);
            end
        end

        function movingTheCrosshairNotifiesListeners(tc)
            tc.Viewer.addVolume(tc.Fixture);
            fired = false;
            got = [];
            lh = addlistener(tc.Viewer, 'CrosshairMoved', @(~, e) capture(e)); %#ok<NASGU>
            tc.Viewer.Crosshair = [2 2 2];

            t = tic;
            while ~fired && toc(t) < 10
                drawnow; pause(0.01);
            end
            tc.verifyTrue(fired, 'CrosshairMoved should fire on a programmatic move');
            tc.verifySize(got, [1 3]);

            function capture(e)
                fired = true;
                got = e.Millimetres;
            end
        end

        function volumeInfoDescribesTheLoadedVolume(tc)
            tc.Viewer.addVolume(tc.Fixture);
            info = tc.Viewer.volumeInfo(1);
            tc.verifyEqual(double(info.pixDims(1:3)), [2 2 2], 'AbsTol', 1e-4);
        end

        function clearRemovesEverything(tc)
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.clear();
            tc.verifyEqual(tc.Viewer.numVolumes(), 0);
        end

        function removeVolumeDropsOne(tc)
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.removeVolume(2);
            tc.verifyEqual(tc.Viewer.numVolumes(), 1);
        end

        function loadsArraysStraightFromTheWorkspace(tc)
            vol = int16(reshape(1:(6*7*8), 6, 7, 8));
            info = tc.Viewer.addVolume(vol, VoxelSize=[3 3 3]);
            tc.verifyEqual(double(info.dims(1:3)), [6 7 8]);
        end

        function appliesColormapAndThreshold(tc)
            tc.Viewer.addVolume(tc.Fixture);
            info = tc.Viewer.addVolume(tc.Fixture, Colormap="hot", Threshold=[100 5000]);
            tc.verifyEqual(char(info.colormap), 'hot');
            tc.verifyEqual(double(info.calMin), 100, 'AbsTol', 1e-3);
            tc.verifyEqual(double(info.calMax), 5000, 'AbsTol', 1e-3);
        end

        function layoutAcceptsNamesNotMagicNumbers(tc)
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.Layout = "axial";
            tc.verifyEqual(tc.Viewer.Layout, "axial");
            tc.Viewer.Layout = "multiplanar";
            tc.verifyEqual(tc.Viewer.Layout, "multiplanar");
        end

        function layoutRejectsUnknownNames(tc)
            tc.verifyError(@() setLayout(tc.Viewer), 'niivue:badLayout');
            function setLayout(v), v.Layout = "sideways"; end
        end

        function snapshotReturnsRenderedPixels(tc)
            % MATLAB's own print and exportapp capture this canvas as solid
            % black, so the viewer has to render and return its own bitmap.
            tc.Viewer.addVolume(tc.Fixture);
            settle(2);
            img = tc.Viewer.snapshot();
            tc.verifyClass(img, 'uint8');
            tc.verifyEqual(ndims(img), 3);
            tc.verifyGreaterThan(size(img, 1), 10);
            tc.verifyGreaterThan(numel(unique(img(:))), 1, ...
                'a captured render should not be a single flat colour');
        end

        function reportsViewerErrorsToMatlab(tc)
            tc.verifyError(@() tc.Viewer.volumeInfo(99), 'niivue:viewerError');
        end

        function arrayVoxelLandsAtTheExpectedMillimetres(tc)
            % Proves the whole array -> NIfTI -> display -> read-back chain,
            % including axis order and origin. A permuted axis or a wrong
            % origin returns a different voxel and the spike is missed.
            sz = [9 11 13];
            voxSize = [2 3 4];
            spike = [4 7 9];                    % 1-based subscript
            Y = zeros(sz, 'single');
            Y(spike(1), spike(2), spike(3)) = 999;
            tc.Viewer.addVolume(Y, VoxelSize=voxSize, Name="spike.nii");

            expectedMM = voxSize .* (spike - 1) - voxSize .* (sz - 1) / 2;
            hit = tc.Viewer.intensityAt(expectedMM);
            tc.verifyEqual(hit(1).value, 999, 'AbsTol', 1e-3, ...
                'the spike must be where the affine says it is');

            miss = tc.Viewer.intensityAt(expectedMM + [voxSize(1) 0 0]);
            tc.verifyEqual(miss(1).value, 0, 'AbsTol', 1e-3, ...
                'the neighbouring voxel must be empty');
        end

        function loadsEveryCommonDataType(tc)
            casts = {@logical, @uint8, @int16, @uint16, @int32, @single, @double};
            for k = 1:numel(casts)
                cast = casts{k};
                A = cast(reshape(mod(1:(4*5*6), 7) + 1, 4, 5, 6));
                info = tc.Viewer.addVolume(A, VoxelSize=[1 1 1]);
                tc.verifyEqual(double(info.dims(1:3)), [4 5 6], ...
                    sprintf('%s should load', func2str(cast)));
                tc.Viewer.clear();
            end
        end

        function loadingAfterClearWorks(tc)
            % Regression: refreshing GL with an empty volume stack destroyed the
            % bind groups, and every later load failed inside createBindGroup.
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.clear();
            info = tc.Viewer.addVolume(tc.Fixture);
            tc.verifyEqual(double(info.index), 1);
            tc.verifyEqual(tc.Viewer.numVolumes(), 1);
        end

        function intensityAtReportsEveryLayer(tc)
            tc.Viewer.addVolume(tc.Fixture);
            tc.Viewer.addVolume(tc.Fixture, Colormap="hot");
            values = tc.Viewer.intensityAt([0 0 0]);
            tc.verifyNumElements(values, 2, 'one entry per loaded layer');
            tc.verifyTrue(isfield(values, 'value'));
        end

        function fourDimensionalSeriesReportsItsFrames(tc)
            T = single(zeros(6, 6, 6, 5));
            for t = 1:5
                T(:, :, :, t) = t;
            end
            info = tc.Viewer.addVolume(T, VoxelSize=[2 2 2]);
            tc.verifyEqual(double(info.nFrame4D), 5);
            tc.Viewer.setFrame(3);
        end

        function volumeInfoAlwaysReportsAWindow(tc)
            % calMin/calMax must exist even when no Threshold was given: JSON
            % drops undefined, which would reach MATLAB as a missing field.
            tc.Viewer.addVolume(tc.Fixture);
            info = tc.Viewer.volumeInfo(1);
            tc.verifyTrue(isfield(info, 'calMin'));
            tc.verifyTrue(isfield(info, 'calMax'));
        end

        function openTilesMakesOnePanelPerImage(tc)
            files = tc.threeFixtures();
            result = tc.Viewer.openTiles(files);
            tc.verifyEqual(double(result.tiles), 3, ...
                'one panel per image, and no spare');
            tc.verifyEmpty(result.failed);
        end

        function openTilesLeavesNoEmptyPanel(tc)
            % Regression: the bridge already opens one panel at startup, so
            % asking for one per image left an unused "No image loaded" tile.
            result = tc.Viewer.openTiles(tc.threeFixtures());
            tc.verifyEqual(double(result.tiles), 3);
        end

        function tiledPanelsShareOneCrosshair(tc)
            tc.Viewer.openTiles(tc.threeFixtures());
            tc.Viewer.Crosshair = [2 -4 2];
            tc.verifyEqual(tc.Viewer.Crosshair, [2 -4 2], 'AbsTol', 0.5);
        end

        function clearCollapsesTilesBackToOnePanel(tc)
            tc.Viewer.openTiles(tc.threeFixtures());
            tc.Viewer.clear();
            result = tc.Viewer.openTiles(tc.threeFixtures());
            tc.verifyEqual(double(result.tiles), 3, ...
                'panels must not accumulate across clears');
        end

        function snapshotCoversEveryPanel(tc)
            % Panels are laid out by the app - a row here, a grid elsewhere -
            % so counting bright quadrants tests the layout, not the capture.
            % Ask the viewer what it composited instead.
            tc.Viewer.openTiles(tc.threeFixtures());
            settle(2);
            [img, info] = tc.Viewer.snapshot();
            tc.verifyEqual(info.panels, 3, 'every panel must be composited');
            tc.verifyEqual(size(img, 2), info.width, 'width must match the composite');
            tc.verifyGreaterThan(numel(unique(img(:))), 1, 'the capture must not be blank');
        end


        function usingAClosedViewerSaysSo(tc)
            v = niivue.Viewer(Name="doomed");
            delete(v.Figure);
            tc.verifyError(@() v.numVolumes(), 'niivue:closed');
        end
    end
end

function settle(seconds)
%SETTLE Pump the event loop so the browser can render.
    t = tic;
    while toc(t) < seconds
        drawnow
        pause(0.01)
    end
end

