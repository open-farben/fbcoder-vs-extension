import { authentication, CancellationToken, commands, env, ExtensionContext, l10n, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from "vscode";
import getUri, { readExtensionFile } from "../utils/getFiles";
import { ApiPrefix, AuthId, AuthSecretKey, DialogModelList, DialogModelSwitching, ExtensionVersion, ServeUrl } from "../config/configures";
import getDocumentLanguage from "../utils/getDocumentLanguage";
import getDocumentLangId from "../utils/getDocumentLangId";
import { CodeTranslateService } from "../service/codeTranslate.service";

/**
 * 激活侧边栏，发送指令到侧边栏
 */
export function activeSideBar(codeSideBar: MainWebviewProvider, type: string) {
	const editor = window.activeTextEditor;
	if (!editor) {
		return false;
	}
	const text = editor.document.getText(editor.selection);
	const lang = getDocumentLanguage(editor);
	if (text.trim() === '') {
		window.showInformationMessage(l10n.t('Please enter some code to start'));
		return false;
	}
	commands.executeCommand("fbcoder-chat.focus");
	codeSideBar.postMessage({
		type,
		data: {
			code: text,
			lang: getDocumentLangId(lang)
		}
	});
}

export class MainWebviewProvider implements WebviewViewProvider {
    webviewView: WebviewView | undefined;
    // 当前版本是否过期，不可用
    isVersionTrust: boolean;
    // webview 是否已经初始化完成
    webviewInited: boolean = false;
    // 当页面还未初始化时接收到任务需要缓存起来
    cacheTaskList: { type: string, data: any }[] = [];
    constructor(private readonly _extensionContext: ExtensionContext, isTrust: boolean) {
        this.isVersionTrust = isTrust;
        _extensionContext.subscriptions.push(
            // 侧边栏执行 code-test命令
            commands.registerCommand(
                "fbcoder.code-test",
                () => {
                    activeSideBar(this, 'code-test');
                }
            ),
            // 侧边栏执行 代码修复命令
            commands.registerCommand(
                "fbcoder.code-repeir",
                () => {
                    activeSideBar(this, 'code-repeir');
                }
            ),
            // 侧边栏执行 代码解释命令
            commands.registerCommand(
                "fbcoder.code-explain",
                () => {
                    activeSideBar(this, 'code-explain');
                }
            ),
            // 接收认证信息变更
            commands.registerCommand(
                "fbcoder.user-change",
                (data) => {
                    this.postMessage({ type: "user-change", data });
                }
            ),
            // 清空对话
            commands.registerCommand(
                "fbcoder.clear-dialog",
                (data) => {
                    this.postMessage({ type: "clear-dialog", data });
                }
            ),
        );
    }
    public async resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        this.webviewView = webviewView;

        // 页面允许添加脚本
        webviewView.webview.options = {
            enableScripts: true
        };

        // 提供页面内容
        webviewView.webview.html = await this.htmlContent(
            webviewView.webview,
            this._extensionContext.extensionUri
        );

        authentication.onDidChangeSessions(async (e) => {
            // 判断是否是当前登录服务变更 
            if (e.provider.id === AuthId) {
                // 获取最新登陆信息
                const session = await authentication.getSession(AuthId, [], { createIfNone: false });
                this.postMessage({ type: "user-change", data: session?.account });
            }
        });

        // 给 webview 增加 监听器
        this._setWebviewMessageListener(webviewView);
    }

    // 读取静态内容
    async htmlContent(webview: Webview, extensionUri: Uri) {
        let html = await readExtensionFile(extensionUri, ['out', 'webview', 'index.html']);
        const baseUrl = getUri(webview, extensionUri, ["out", "webview", "/"]);
        return html.replace('replaceBaseUrl', baseUrl.toString());
    }

    // 监听器方法
    private _setWebviewMessageListener(webviewView: WebviewView) {
        webviewView.webview.onDidReceiveMessage(async (message:any) => {
            const { type, data, msg } = message;
            switch (type) {
                // 消息提示方法 Information Warning Error
                case "show-message":
                    if (data.type) {
                        (window as any)[`show${data.type}Message`](data.message);
                    }
                    break;
                // 运行 vscode 指令方法
                case "run-command":
                    commands.executeCommand(data);
                    break;
                // 把结果窗的内容插入到光标位置
                case "code-insert":
                    const editor = window.activeTextEditor;
                    if (!editor) {break;}
                    // 奖编辑窗中选中的文字替换为结果
                    editor.edit(async (editBuilder:any) => {
                        var s = editor.selection;
                        editBuilder.replace(s, message.data);
                    });
                    break;
                // 去下载
                case "code.downLoad":
                    break;
                // webview初始化完成 hook
                case "webview-init-finished":
                    const session = await this._extensionContext.secrets.get(AuthSecretKey);
                    // 将 vscode 配置传递给 webview 渲染
                    webviewView.webview.postMessage({
                        type: "code-config-init",
                        data: {
                            apiPrefix: ApiPrefix,
                            modelSwitching: DialogModelList[DialogModelSwitching],
                            session,
                            version: ExtensionVersion,
                            apiUrl: ServeUrl,
                            versionExpired: this.isVersionTrust,
                            cacheTaskList: this.cacheTaskList
                        },
                    });
                    // 标记 webview 已经初始化完成
                    this.webviewInited = true;
                    break;
                case "translate-code":
                    const { code, srcLang, dstLang } = data;
                    const translateService = new CodeTranslateService();
                    const res = await translateService.getTranslateCode(code, srcLang, dstLang);
                    webviewView.webview.postMessage({
                        type: "show-translate",
                        data: {
                            code: res
                        },
                    });
                    break;
                case "code.copy":
                    env.clipboard.writeText(message.data);
                    window.showInformationMessage("复制成功！");
                    break;
                case "code.loginOut":
                    void commands.executeCommand("fbcoder.login-out");
                    break;
                case "code.createFile":
                    commands.executeCommand('createNewFile', message.data);
                    break;
            }
        });
    }

    postMessage(message: { type: string, data: any }) {
        if (!this.webviewInited) {
            // 还没初始化时，缓存起来
            this.cacheTaskList.push(message);
        } else {
            // 已经初始化了，就直接传给 webview
            this.webviewView?.webview.postMessage(message);
        }
    }

    setVersionTrust(isTrust: boolean) {
        // 设计版本的可信度
        this.isVersionTrust = isTrust;
        // 通知 webview 版本可信度变更
        if (!isTrust) {
            this.webviewView?.webview.postMessage({ type: 'version-expired' });
        }
    }

}
