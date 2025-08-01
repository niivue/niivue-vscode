import { render } from 'preact';
import { App } from '../../../packages/niivue-react/dist/components/App.js';
import { defaultSettings } from '../../../packages/niivue-react/dist/settings.js';

const appProps = {
  settings: defaultSettings,
  // Add other props as needed
};

const root = document.getElementById('app');
if (root) {
  render(<App appProps={appProps} />, root);
}
