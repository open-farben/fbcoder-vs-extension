import { env } from "vscode";
import { Locale } from "./zh-cn";

export class LanguageService {
    tag = Locale;
    constructor() {
        this.getTranslate();
    }
    async getTranslate() {
        const { Locale: realLocale } = await import(`./${env.language || 'zh-cn'}/index.ts`);
        this.tag = realLocale;
    }
}

export const Lang =  new LanguageService();