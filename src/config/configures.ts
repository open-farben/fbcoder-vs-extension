import { extensions, workspace } from "vscode";

// 扩展的版本
export const ExtensionVersion = extensions.getExtension('Farben.fbcoder')?.packageJSON.version;
// 获取全部本插件相关设置
const configuration = workspace.getConfiguration("fbcoder", undefined);

// 请求地址前辍
export const ApiPrefix = configuration.get("apiPrefix") || '/agent/models';

const DialogModelSwitchingStr = String(configuration.get("ModelSwitching", "1"));
export const DialogModelSwitching = parseInt(DialogModelSwitchingStr);
export const DialogModelList = ["","fmcoder","gpt4o"];
// 获取定制取务的地址
export const ServeUrl = configuration.get("serveUrl") || "https://farchat.farben.com.cn";

export const TranslatexUrl = `${ServeUrl}${ApiPrefix}/translatex`;

// 登录地址
export const LoginUrl = ServeUrl + '/web';

// 当前是否为登陆模式
export const NeedLogin = true;

export const AuthId = "fbcodeLogin";
export const AuthSecretKey = "fbcodeLoginSecretKey";