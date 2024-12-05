import { ExtensionContext, StatusBarAlignment, window } from "vscode";
import { MessagesCenter } from "./messagesCenter";

export class StatusBar {
    instatce = window.createStatusBarItem(
        StatusBarAlignment.Right,
        100
    );
    constructor(private context: ExtensionContext, private msg: MessagesCenter) {
        // 创建一个新的状态栏，设置对齐样式，100代表该项，的优先级。数值越高意味着项目应该更靠左显示。
        // 设置状态栏被点击时要调用的命令
        this.instatce.command = 'fbcoder.disable-enable';
        this.instatce.show();
        this.instatce.text = ' $(github-alt) ';
        // 执行注册状态栏
        this.context.subscriptions.push(this.instatce);
        // 展示 loading状态 + 文字
        this.msg.subscribe('LOADING_INFO', (data) => this.loading(data));
        // 展示 通用图标 + 文字，3 秒后文字隐藏
        this.msg.subscribe('SHOW_TEXT', (data) => this.show(data));
    }

    // 加载 + 文字
    loading(info: string) {
        this.instatce.text = ` $(loading~spin) ` + info;
    }

    //
    show(info: string) {
        this.instatce.text = ` $(github-alt) ` + info;
        if (info) {
            setTimeout(() => this.instatce.text = ` $(github-alt) `, 2000);
        }
    }
}