import { config, t } from '@vscode/l10n';

if (process.env['EXTENSION_BUNDLE_PATH']) {
	config({
		fsPath: process.env['EXTENSION_BUNDLE_PATH']
	});
}

const message = t('Hello {0}', 'CLI');
console.log(message + '\n');