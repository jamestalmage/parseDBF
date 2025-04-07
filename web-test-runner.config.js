import {esbuildPlugin} from '@web/dev-server-esbuild';
import {playwrightLauncher} from '@web/test-runner-playwright';

const config = {
	testFramework: 'mocha',
	nodeResolve: true,
	files: ['test/*.ts'],
	browsers: [
		playwrightLauncher({product: 'chromium'}),
		playwrightLauncher({product: 'firefox'}),
		playwrightLauncher({product: 'webkit'}),
	],
	plugins: [esbuildPlugin({ts: true})],
};

export default config;
