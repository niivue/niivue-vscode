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
        function requireViewer(tc)
            tc.assumeFalse(isMATLABReleaseOlderThan("R2023a"), ...
                'Needs R2023a for sendEventToHTMLSource.');
            tc.assumeTrue(usejava('jvm'), 'Needs a graphical session.');
            try
                niivue.internal.viewerPage();
            catch
                tc.assumeFail('Viewer bundle not built: pnpm --filter @niivue/matlab build');
            end
            % Open one viewer up front. A machine with no usable WebGL context
            % - a headless runner, a VM, a remote desktop - should skip these
            % with a readable reason rather than fail every case on a timeout.
            try
                probe = niivue.Viewer(Name="probe");
                delete(probe);
            catch err
                tc.assumeFail(sprintf( ...
                    'This session cannot host the viewer (%s). Run niivue.diagnose.', ...
                    err.identifier));
            end
        end
    end

    methods (TestMethodSetup)
        function openViewer(tc)
            tc.Fixture = fullfile(fileparts(mfilename('fullpath')), 'fixtures', 'phantom.nii');
            if ~isfile(tc.Fixture)
                d = fileparts(tc.Fixture);
                if ~exist(d, 'dir'), mkdir(d); end
                % A small asymmetric phantom: distinct along each axis, so an
                % axis mix-up shows up as a wrong intensity rather than passing.
                [x, y, z] = ndgrid(1:12, 1:14, 1:16);
                vol = int16(x + 100*y + 10000*z);
                niivue.internal.writeNifti(tc.Fixture, vol, [2 2 2]);
            end
            tc.Viewer = niivue.Viewer(Name="test");
            tc.addTeardown(@() delete(tc.Viewer));
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
