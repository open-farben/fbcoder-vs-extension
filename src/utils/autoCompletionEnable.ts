import { ExtensionContext, window, workspace } from "vscode";
import { Lang } from "../i18n";

// 启用 / 禁用 自动补全功能
export async function AutoCompletionEnable(context: ExtensionContext) {
    const configuration = workspace.getConfiguration("fbcoder");
    const currentStatus = configuration.get('OnlyKeyControl');
    // 打开确认对话，询问是否禁用自动提示 
    const answer = await window.showInformationMessage(
        currentStatus ? Lang.tag.enableAutoSuggest : Lang.tag.disableAutoSuggest,
        Lang.tag.confirmation,
    );
    console.log('当前状态', currentStatus);
    // 如果确认的话，更新设置。
    if (answer === Lang.tag.confirmation) {
        console.log('更新设置为', !currentStatus);
        // 更新设置
        await configuration.update("OnlyKeyControl", !currentStatus);
        console.log('取值验证', configuration.get('OnlyKeyControl'));
    }
}