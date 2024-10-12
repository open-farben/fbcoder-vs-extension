import { CancellationToken, ExtensionContext, Uri, Webview, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from "vscode";
import getUri, { readExtensionFile } from "../utils/getFiles";

export class mainWebviewProvider implements WebviewViewProvider {
    webviewView: WebviewView | undefined;
    isTrust: boolean;
    constructor(private readonly _extensionContext: ExtensionContext, isTrust: boolean) {
        this.isTrust = isTrust;
    }
    public async resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        this.webviewView = webviewView;

        // 页面允许添加脚本
        webviewView.webview.options = {
            enableScripts: true,
        };

        // 提供页面内容
        webviewView.webview.html = await this.htmlContent(
            webviewView.webview,
            this._extensionContext.extensionUri
        );
    }

    async htmlContent(webview: Webview, extensionUri: Uri) {
        let html = await readExtensionFile(extensionUri, ['out', 'webview', 'index.html']);
        // 替换baseUrl
        const baseUrl = getUri(webview, extensionUri, ["out", "webview", "/"]);
        html = html.replace('replaceBaseUrl', baseUrl.toString());
        return html;
    }

}
