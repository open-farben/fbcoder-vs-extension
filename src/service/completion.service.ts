import axios from "axios";
import { ExtensionVersion, ServeUrl } from "../config/configures";
import { authentication } from "vscode";
import { MainAuthenticationProvider } from "../provider/mainAuthenticationProvider";
import { GetDeppendenciesContent } from "../utils/getDependenciesContent";

export class CompletionService {
    // 下文
    async GetCodeCompletions(prompt: string, suffix: string, lang: string, temperature: number ): Promise<string[]> {
        // 获取session
        const session = await authentication.getSession(MainAuthenticationProvider.id, [], { createIfNone: false });
        if (!session) { return []; }
        // 提取当前文件的依赖正文
        const dependenciesStr = await GetDeppendenciesContent();
        const payload = {
            lang: lang,
            prompt: dependenciesStr + prompt,
            suffix: suffix,
            temperature
        };
        return axios.post(`${ServeUrl}/agent/models/generatex`, payload, 
            { 
                proxy: false, 
                timeout: 120000, 
                headers: { 
                    "model": 'auto',
                    "uuid": session.accessToken,
                    "version": "vscode:" + ExtensionVersion
                }
            }).then(async (res) => {
                console.log(payload, res);
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