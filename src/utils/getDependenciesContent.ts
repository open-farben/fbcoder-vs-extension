import { Uri, window, workspace } from "vscode";

export async function GetDeppendenciesContent() {
    const currentFile = window.activeTextEditor?.document;
    if (!currentFile) { return; };
    const list = getDeppendencies(currentFile?.getText(), currentFile.languageId);
    let dependenciesStr = '';
    if (list.length) {
        // // 获取当前窗口中所有可见的文本编辑器
        const fileList = window.tabGroups.all.flatMap(({ tabs }) => tabs);
        // 遍历每个编辑器
        for (const editor of fileList) {
            // 获取文本文档
            const { uri: fileUri } = editor.input as { uri: Uri };
            // 排除掉当前文件
            if (fileUri.path === currentFile?.uri.path) { continue; };
            // 打开的文件名称排除了后辍名
            const fileName = fileUri.path.split('/').pop()?.split('.')[0];
            if (list.some((item) => item.split('/').pop()?.split('.')[0] === fileName)) {
                // 获取并打印文件内容
               const document = await workspace.openTextDocument(fileUri);
                // 获取文件内容
                const content = document.getText();
                dependenciesStr += `# ${fileName}\n\n${content}\n`;
            }
        }
    }
    return dependenciesStr;
}

function getDeppendencies(currentFileContent: string, language: string) {
    let dependencies: any[] = [];
    switch (language) {
        case 'JavaScript':
            // 查找CommonJS的require require ""
            const requireRegex = /require]|import\(['"]([^'"]+)['"]\)/g;
            let match;
            while ((match = requireRegex.exec(currentFileContent)) !== null) {
                dependencies.push(match[1]);
            }

            // 查找CommonJS的require require ""
            const importOnly = /import\s['"]([^'"]+)['"]/g;
            while ((match = importOnly.exec(currentFileContent)) !== null) {
                dependencies.push(match[1]);
            }

            // 查找ES6模块导入 import { } from " "
            const importRegex = /import\s+(?:{[^}]*}|\*|['"][^'"]+['"]|[^\s]+)\s+from\s+['"]([^'"]+)['"]/g;
            while ((match = importRegex.exec(currentFileContent)) !== null) {
                dependencies.push(match[1]);
            }
        case 'go':
        case 'c':
        case 'python':
        case 'java':
        case 'cpp':
            break;
        default:
            break;
    }
    return dependencies;
}