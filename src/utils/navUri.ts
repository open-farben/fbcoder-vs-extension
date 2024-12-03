import * as vscode from "vscode";

export const navUri = async (
    uri: vscode.Uri,
    language: string,
    mode: string
) => {
    // 调用供应器函数 打开生成地址 文本
    const doc = await vscode.workspace.openTextDocument(uri);

    await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.Beside,
        preview: true,
        preserveFocus: true,
    });

    vscode.languages.setTextDocumentLanguage(doc, language);
};

export const navContent = async (
    content: string,
    language: string,
    mode: string
) => {
    // 调用供应器函数 打开生成地址 文本
    const doc = await vscode.workspace.openTextDocument({ content, language });

    await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.Beside,
        preview: true,
        preserveFocus: true,
    });

    vscode.languages.setTextDocumentLanguage(doc, language);
};