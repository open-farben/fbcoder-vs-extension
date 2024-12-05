import { MainWebviewProvider } from './provider/mainWebviewProvider';
import { ExtensionVersion, NeedLogin } from './config/configures';
import { RegisterCommand } from './registerCommand';
import { authentication, AuthenticationProvider, commands, env, ExtensionContext, l10n, languages, window } from 'vscode';
import { AddListener } from './addListener';
import { MainAuthenticationProvider } from './provider/mainAuthenticationProvider';
import { InlineCompletionProvider } from './provider/inlineCompletionProvider';
import { StatusBar } from './statusBar';
import { MessagesCenter } from './messagesCenter';

export async function activate(context: ExtensionContext) {
	// 创建一个输出通道，在此 appendLine 内容会出显在下部 PANEL中的 OUTPUT 栏中。
	const outputChannel = window.createOutputChannel("FBCoder");

	outputChannel.appendLine('恭喜, 你的扩展 "fbcoder" 已经启动了！');

	// 初始化事件中心
	const messageCenter = new MessagesCenter();

	// 初始化状态栏
	new StatusBar(context, messageCenter);

	// 设置全局 登陆 状态
	commands.executeCommand('setContext', 'fbcode.needLogin', NeedLogin);
	
	// 如查是新安装或是新版本初打开，就打开欢迎页
	let welcomeShownVersion = (await context.secrets.get("fbcode_WelcomeShowVersion")) || '';
	if (env.isNewAppInstall || welcomeShownVersion !== ExtensionVersion) {
		commands.executeCommand("fbcoder.welcome-page").then(() => {
			context.secrets.store("fbcode_WelcomeShowVersion", ExtensionVersion);
		});
	}

	// 注册插件侧边栏
	const mainSildeBar = new MainWebviewProvider(context, true);
	context.subscriptions.push(window.registerWebviewViewProvider(
		"fbcoder-chat",mainSildeBar,
		{
			webviewOptions: {
				// false 时 侧边栏被隐藏时就销毁，true 时内容将会被缓存
				retainContextWhenHidden: false
			}
		}
	));

	// 注册认证服务
	let authProvider: AuthenticationProvider = new MainAuthenticationProvider(context);
	context.subscriptions.push(authentication.registerAuthenticationProvider(MainAuthenticationProvider.id, "fbcoder", authProvider));
	// 是否登录
	const session = await authentication.getSession(MainAuthenticationProvider.id, [], { createIfNone: false });
	if (!session) {
		// 登录提示
		window.showInformationMessage(l10n.t('Please login to use GPTCoder'), l10n.t('Login')).then(async (choose) => {
			// 如果点登录的话打开登录网页
			if (choose === l10n.t('Login')) {
				await authentication.getSession(MainAuthenticationProvider.id, [], { createIfNone: true });
			}
		});
	} else {
		// 欢迎提示
		window.showInformationMessage(l10n.t(`Welcome back {0}.`, [ session.account.label ]));
	}

	// 代码补全
	const inlineCompletionProvider = new InlineCompletionProvider(messageCenter, context);
	languages.registerInlineCompletionItemProvider({ pattern: "**" }, inlineCompletionProvider);

	// 注册命令
	RegisterCommand(context, outputChannel, messageCenter);
	// 增加监听逻辑
	AddListener(context, mainSildeBar);
}

export function deactivate() {}
