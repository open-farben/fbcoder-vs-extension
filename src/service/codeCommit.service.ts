import { authentication } from "vscode";
import { MainAuthenticationProvider } from "../provider/mainAuthenticationProvider";
import { ExtensionVersion, ServeUrl } from "../config/configures";
import { httpClient } from "../utils/httpClient";

export class CodeCommitService {
    async getCodeCommit(prompt: string, lang: string) {
        // 获取session
        const session = await authentication.getSession(MainAuthenticationProvider.id, [], { createIfNone: false });
        if (!session) { return []; }
        // 提取当前文件的依赖正文
        const payload = {
            lang: lang,
            prompt: prompt,
        };
        return httpClient.post(`${ServeUrl}/agent/models/annotationx`, payload, { 
            headers: { 
                "model": 'auto',
                "uuid": session.accessToken,
                "version": "vscode:" + ExtensionVersion
            }
        }).then(async (res) => {
            if (res?.data.status === 0) {
                let codeArray = res?.data.result.code;
                const completions = Array<string>();
                for (let i = 0; i < codeArray.length; i++) {
                    const completion = codeArray[i];
                    let tmpstr = completion;
                    if (tmpstr.trim() === "") { continue; }
                    if (completions.includes(completion)) { continue; };
                    const completionStr = completion;
                    completions.push(completionStr);
                }
                return completions;
            } else {
                return [];
            }
        });
    }
}