import axios from "axios";
import { ExtensionVersion, ServeUrl } from "../config/configures";
import { env, ExtensionContext, Uri, version } from "vscode";
import { v4 } from "uuid";

// 认证服务
export class AuthService {
    uuids: string = '';
    loggingCount = 0;
    constructor(private readonly context: ExtensionContext) {}
    // 登录
    login():Promise<{ account: string, userName: string, uuids: string, email: string }> {
        if (this.loggingCount > 0) {
            return Promise.reject(false);
        }
        return new Promise(async (resolve, reject) => {
            // 是否打开成功
            await this.openLoginPage();
            // 轮询方法
            const getInfo = () => {
                this.loggingCount += 1;
                this.getUserInfo(this.uuids).then(result => {
                    if (result) {
                        // 登录成功
                        resolve({ ...result, uuids: this.uuids });
                        this.loggingCount = 0;
                    } else {
                        // 未登录成功的话，1 秒后再试，10 分钟以内有效。
                        if (this.loggingCount < 600) {
                            setTimeout(() => {
                                getInfo();
                            }, 1000);
                        } else {
                            reject('登录失败！');
                            this.loggingCount = 0;
                        }
                    }
                }).catch((e) => {
                    console.error(e);
                    reject('登陆服务请求失败');
                    this.loggingCount = 0;
                });
            };
            // 开始轮询
            getInfo();
        });
    }

    // 打开登录页面
    openLoginPage() {
        this.uuids = v4();
        const callback = new URL(`${ServeUrl}/web/user/codelogin`);
        callback.searchParams.set("sessionId", this.uuids);
        callback.searchParams.set("machineId", env.machineId);
        callback.searchParams.set("device", "vscode_" + env.appHost);
        callback.searchParams.set("ideName", "vscode");
        callback.searchParams.set("ideVersion", version);
        callback.searchParams.set("pluginType", "VSCode");
        callback.searchParams.set("pluginVersion", ExtensionVersion);
        // 打开新的浏览器页面去登录
        return env.openExternal(Uri.parse(callback.toString()));
    }

    // 退出登录
    logout(token: string, userId: string) {
        return new Promise(async (resolve, reject) => {
            let result = await axios.post(`${ServeUrl}/coder-api/plugin/logout`, {
                uuid: token,
                userId
            }).catch((e) => {
                console.log(e);
                resolve(false);
            });
            console.log('退出登录结果', result);
            // 退出登陆成功
            if (result && result.data.code === '0') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    // 验证登录是否有效，获取用户信息
    getUserInfo(token: string): Promise<{ account: string, userName: string, email: string }> {
        return new Promise(async (resolve, reject) => {
            let result = await axios.get(`${ServeUrl}/coder-api/plugin/getUserInfo?uuid=${token}`);
            if (result && result.data.code === "0") {
                const { account, name: userName, email } = result.data.data;
                // 成功登陆
                resolve({ account, userName, email });
            }
            if (['A0507','A0201','401'].includes(result.data.code)) {
                // 未登陆成功
                resolve(result.data.data);
            } else {
                reject("InternalError:" + result.data.code);
            }
        });
    }
}