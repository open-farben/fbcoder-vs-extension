import { authentication, ExtensionContext, WebviewViewProvider, window, workspace } from "vscode";
import getDocumentLanguage from "./utils/getDocumentLanguage";
import getDocumentLangId from "./utils/getDocumentLangId";
import { MainWebviewProvider } from "./provider/mainWebviewProvider";
import { MainAuthenticationProvider } from "./provider/mainAuthenticationProvider";

export function AddListener(context: ExtensionContext, webView: MainWebviewProvider) {

	window.onDidChangeTextEditorSelection((e) => {
		const editor = window.activeTextEditor;
		if (!editor) { return; }
		const content = editor.document.getText(e.selections[0]);
		if (content.trim() === '') { return; }
		const lang = getDocumentLanguage(editor);
		webView.postMessage({
			type: "code-selected",
			data: {
				code: content,
				language: getDocumentLangId(lang)
			}
		});
	});

    authentication.onDidChangeSessions(async (e) => {
        console.log('认证信息', e);
        // 判断是否是当前登录服务变更 
        if (e.provider.id === MainAuthenticationProvider.id) {
            // 获取最新登陆信息
            const session = await authentication.getSession(MainAuthenticationProvider.id, [], { createIfNone: false });
            webView.postMessage({ type: 'login-change', data: { userInfo: session?.account }});
        }
    });

    window.onDidChangeActiveTextEditor(() => {
        const editor = window.activeTextEditor;
        let defaultDstLang;
        if (editor) {
            defaultDstLang = getDocumentLanguage(editor);
        } else {
            defaultDstLang = "C";
        }
        // 通知 webview 编辑器激活内容切换
        // webview.postMessage({
        //     command: "code.changeDstLang",
        //     dstLang: defaultDstLang,
        // });
    });

	// 监听配置变更
	workspace.onDidChangeConfiguration(async (e) => {
		const configuration = workspace.getConfiguration("fbcoder");
		// 服务器地址变更时 需要通知 webview 进行更新
		if (e.affectsConfiguration('fbcoder.serveUrl')) {
			webView.postMessage({ type: 'config-change', data: { serveUrl: configuration.get('serveUrl') }});
		}
		// 配置启用禁用 自动提示时，更新变量
        if (e.affectsConfiguration("fbcoder.OnlyKeyControl")) {
            const _onlyKeyControl = configuration.get('OnlyKeyControl', false);
            context.globalState.update("DisableInlineCompletion", _onlyKeyControl);
        }
    });
}