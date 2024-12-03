import { commands, env, ExtensionContext, l10n, OutputChannel, ShellExecution, Task, tasks, TaskScope, Uri, window } from "vscode";
import { AutoCompletionEnable } from "./utils/autoCompletionEnable";
import { ServeUrl } from "./config/configures";
import getDocumentLanguage from "./utils/getDocumentLanguage";
import getDocumentLangId from "./utils/getDocumentLangId";
import { navContent } from "./utils/navUri";
import welcomePage from "./welcomePage";
import { CodeCommitService } from "./service/codeCommit.service";
import { MessagesCenter } from "./messagesCenter";
import path from "path";

export function RegisterCommand(
	context: ExtensionContext,
	outputChannel: OutputChannel,
	msg: MessagesCenter
) {
	// 注册命令
	context.subscriptions.push(

		// 打开欢迎页
		commands.registerCommand("fbcoder.welcome-page", async () => {
			await welcomePage(context);
		}),

		// 注册 启用/禁用 代码自动补全功能
		commands.registerCommand("fbcoder.disable-enable", async () => {
			// 启用/禁用 代码自动补全方法
			AutoCompletionEnable(context);
		}),

		// 用户接收补全内容时的回调
		commands.registerCommand("fbcoder.completion-accept", async (text: string) => {
			// 启用/禁用 代码自动补全方法
			console.log('补全内空参数', text);
		}),

		// 注册打开设置的命令
		commands.registerCommand("fbcoder.open-setting", async () => {
			// 启用/禁用 代码自动补全方法
			commands.executeCommand('workbench.action.openSettings', '@ext:Farben.fbcoder');
		}),

		// 注册 修改密码命令 
		commands.registerCommand("fbcoder.change-passworld", async (userID) => {
			const callback = new URL(`${ServeUrl}/web/operate/user/codelogin`);
			if (!userID) { return; }
			callback.searchParams.set("account", userID);
			env.openExternal(Uri.parse(callback.toString()));
		}),

		// 注册新建文件指令
		commands.registerCommand('fbcoder.create-file', async (code) => {
			const editor = window.activeTextEditor;
			const lang = editor ? getDocumentLanguage(editor) : '';
			const langId = lang ? getDocumentLangId(lang) : '';
			await navContent(code, langId, "GPTCoder");
		}),

		// 侧边栏执行 代码解释命令
		commands.registerCommand("fbcoder.generate-comment", async () => {
			const editor = window.activeTextEditor;
			if (!editor) {
				return false;
			}
			// 这里是首个选中，当有多个选中时，只有第一个生效
			const selectContent = editor.document.getText(editor.selection);
			const lang = getDocumentLanguage(editor);
			if (selectContent.trim() === '') {
				window.showInformationMessage(l10n.t('Please enter some code to start'));
				return false;
			}
			// 请求返回结果
			const api = new CodeCommitService();
			msg.trigger({ type: 'LOADING_INFO', data: '正在加载...'});
			const res = await api.getCodeCommit(selectContent, lang);
			msg.trigger({ type: 'SHOW_TEXT', data: '完成'});
			// console.log(res);
			if (res && res.length > 0) {
				editor.edit(function (edit: any) {
					edit.replace(editor.selection, res[0]);
				});
			}
		}),

		// l18n 的翻译 demo
		commands.registerCommand('fbcoder.helloWorld', async () => {
			const message = l10n.t('Hello');
			window.showInformationMessage(message);
			window.showInformationMessage('Hello World from fbcoder!');
			outputChannel.appendLine('Hello, this is a message from My Output Channel!');
			outputChannel.show(); // 跳转显示输出通道并把当前的内容列出来

			// This is showing how you might pass the vscode.l10n.uri down to
			// a subprocess if you have one that your extension spawns.
			await tasks.executeTask(
				new Task(
					{ type: 'shell' },
					TaskScope.Global,
					message,
					message,
					new ShellExecution(`node ${path.join(__dirname, 'cli.js')}`, {
						env: l10n.uri ? { EXTENSION_BUNDLE_PATH: l10n.uri?.fsPath } : undefined
					})));
			const messageDone = l10n.t('Hello {name}', { name: 'FINISHED' });
			window.showInformationMessage(messageDone);
		}),

		commands.registerCommand(
			'extension.sayBye',
			() => {
				const message = l10n.t({
					message: 'Bye {0}',
					args: ['Joey'],
					comment: ['user name']
				});
				window.showInformationMessage(message);
			}
		)
	);
}