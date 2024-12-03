import { authentication } from "vscode";
import { AuthId, DialogModelList, DialogModelSwitching, ExtensionVersion, TranslatexUrl } from "../config/configures";
import { httpClient } from "../utils/httpClient";

export class CodeTranslateService {
    async getTranslateCode(prompt: string, src_lang: string, dst_lang: string) {
        const session = await authentication.getSession(AuthId, [], { createIfNone: false });
        if (!session) { return []; };
        const payload = {
            prompt: prompt,
            n: 1,
            src_lang: src_lang,
            dst_lang: dst_lang
        };
        return httpClient.post(TranslatexUrl, payload, { headers: { 
            "model": DialogModelList[DialogModelSwitching],
            "uuid": session.accessToken,
            "version": "vscode:" + ExtensionVersion
        }}).then( async (res: any) => {
            let translation = '';
            if (res?.data.status === 0) {
                let codeArray = res?.data.result.code;
                for (let i = 0; i < codeArray.length; i++) {
                    const translationStr = codeArray[i];
                    let tmpstr = translationStr;
                    if (tmpstr.trim() === "") { continue; }
                    translation = tmpstr;
                }
            }
            return translation;
        });
    }
} 