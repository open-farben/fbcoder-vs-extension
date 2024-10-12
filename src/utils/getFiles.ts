import { Uri, Webview, workspace } from 'vscode';

export async function readExtensionFile(extensionUri: Uri, pathList: string[]):Promise<string> {
    const uri = Uri.joinPath(extensionUri, ...pathList);
    return new Promise((resolve, reject) => {
        workspace.fs.readFile(uri).then(buffer => {
            resolve(buffer.toString());
        });
    });
}

export async function readExtensionWebviewFileList(extensionUri: Uri, pathList: string[]):Promise<string[]> {
    const uri = Uri.joinPath(extensionUri, ...pathList);
    return new Promise((resolve, reject) => {
        workspace.fs.readDirectory(uri).then((data) => {
            resolve(data.filter(([name, type]) => type === 1).map(([name, type]) => name));
        });
    });
}

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export default function getUri(
    webview: Webview,
    extensionUri: Uri,
    pathList: string[]
) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}
