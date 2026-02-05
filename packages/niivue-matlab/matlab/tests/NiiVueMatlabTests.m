classdef NiiVueMatlabTests < matlab.unittest.TestCase
    % NIIVUEMATLABTESTS Unit tests for NiiVue MATLAB package
    %   Tests package structure, class definitions, and basic functionality
    
    properties (TestParameter)
        % No parameters needed for basic tests
    end
    
    methods (TestClassSetup)
        function addPackageToPath(testCase)
            % Add the matlab directory to path
            packageRoot = fileparts(fileparts(mfilename('fullpath')));
            addpath(packageRoot);
            testCase.addTeardown(@() rmpath(packageRoot));
        end
    end
    
    methods (Test)
        function testControllerClassExists(testCase)
            % Verify Controller class exists
            testCase.verifyTrue(exist('niivue.Controller', 'class') == 8, ...
                'niivue.Controller class should exist');
        end
        
        function testViewerFunctionExists(testCase)
            % Verify Viewer function exists
            testCase.verifyTrue(exist('niivue.Viewer', 'file') > 0, ...
                'niivue.Viewer function should exist');
        end
        
        function testComponentClassExists(testCase)
            % Verify Component class exists
            testCase.verifyTrue(exist('niivue.Component', 'class') == 8, ...
                'niivue.Component class should exist');
        end
        
        function testControllerMethods(testCase)
            % Verify Controller has expected methods
            methods = {'Controller', 'addVolume', 'setColormap', ...
                'setOpacity', 'addMesh', 'setCrosshair', ...
                'setSliceType', 'clear', 'delete'};
            
            mc = ?niivue.Controller;
            methodNames = {mc.MethodList.Name};
            
            for i = 1:length(methods)
                testCase.verifyTrue(ismember(methods{i}, methodNames), ...
                    sprintf('Controller should have method: %s', methods{i}));
            end
        end
        
        function testComponentMethods(testCase)
            % Verify Component has expected methods
            methods = {'addVolume', 'setColormap', 'setCrosshair'};
            
            mc = ?niivue.Component;
            methodNames = {mc.MethodList.Name};
            
            for i = 1:length(methods)
                testCase.verifyTrue(ismember(methods{i}, methodNames), ...
                    sprintf('Component should have method: %s', methods{i}));
            end
        end
        
        function testViewerPathUtility(testCase)
            % Test that getViewerPath can find the HTML file
            htmlPath = niivue.Controller.getViewerPath();
            testCase.verifyTrue(exist(htmlPath, 'file') > 0, ...
                'Viewer HTML file should exist at the returned path');
            testCase.verifyTrue(endsWith(htmlPath, 'index.html'), ...
                'Path should point to index.html');
        end
        
        function testBase64EncodingAvailable(testCase)
            % Verify MATLAB's base64 encoding is available
            testData = uint8([1, 2, 3, 4, 5]);
            testCase.verifyWarningFree(@() matlab.net.base64encode(testData), ...
                'base64encode should be available');
        end
        
        function testControllerProperties(testCase)
            % Verify Controller has expected properties
            properties = {'Figure', 'HTMLComponent', 'CrosshairPos'};
            
            mc = ?niivue.Controller;
            propNames = {mc.PropertyList.Name};
            
            for i = 1:length(properties)
                testCase.verifyTrue(ismember(properties{i}, propNames), ...
                    sprintf('Controller should have property: %s', properties{i}));
            end
        end
        
        function testComponentProperties(testCase)
            % Verify Component has expected properties
            properties = {'FilePath', 'Colormap', 'Opacity', 'CrosshairPos'};
            
            mc = ?niivue.Component;
            propNames = {mc.PropertyList.Name};
            
            for i = 1:length(properties)
                testCase.verifyTrue(ismember(properties{i}, propNames), ...
                    sprintf('Component should have property: %s', properties{i}));
            end
        end
    end
end
