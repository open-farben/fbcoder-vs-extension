import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent,
    AuthenticationSession,
    commands,
    env,
    EventEmitter,
    ExtensionContext,
    l10n,
    ProgressLocation,
    Uri,
    window
} from "vscode";
import { AuthService } from "../service/auth.service";
import { AuthId, AuthSecretKey, ServeUrl } from "../config/configures";

class AuthSession implements AuthenticationSession {
	readonly account = { id: 'userId', label: 'useName' };
	readonly id = MainAuthenticationProvider.id;
	readonly scopes = [];
	constructor(public readonly accessToken: string, userId: string, userName: string) {
        this.account.id = userId;
        this.account.label = userName;
    }
}

export class MainAuthenticationProvider implements AuthenticationProvider  {
    static id = AuthId;
    static secretKey = AuthSecretKey;
    userInfo!: { userId: string, userName: string };
    authService!:AuthService;
    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    get onDidChangeSessions() {
        return this._onDidChangeSessions.event;
    }
    constructor(private readonly _extensionContext: ExtensionContext) {
        this.authService = new AuthService(_extensionContext);
		// 注册所有跟认证有关的命令，为的就是要把认证服务又注入其它服务，解偶
        _extensionContext.subscriptions.push(
            // 注册 修改退出登录命令
            commands.registerCommand("fbcoder.login-out", async () => {
                this.removeSession();
            }),
            commands.registerCommand("fbcoder.change-password", async () => {
                const callback = new URL(`${ServeUrl}/web/user/codelogin`);
                if (!this.userInfo.userId) { return; };
                callback.searchParams.set("account", this.userInfo.userId);
                env.openExternal(Uri.parse(callback.toString()));
            }),
            commands.registerCommand("fbcoder.go-for-login", async () => {
                await authentication.getSession(AuthId, [], { createIfNone: true });
            })
        );
        // 初始化验证用户信息
        this.getSessions().then(res => {
            const userData = res[0];
            if (userData) {
                this.userInfo = { 
                    userId: userData.account.id,
                    userName: userData.account.label,
                };
            }
            commands.executeCommand('fbcoder.user-change', this.userInfo);
        });
    }

    // 创建用户登录
    createSession(): Thenable<AuthenticationSession> {
        return window.withProgress({
            location: ProgressLocation.Notification,
            title: "正在登录...",
            cancellable: true
        }, (progress, token) => {
            // 点击取消登录执行操作
            token.onCancellationRequested(() => {
                // 设置请求上限，让轮询登陆取消执行
                this.authService.loggingCount = 999;
            });
            return this.authService.login().then( async res => {
                const newSession = new AuthSession(res.uuids, res.account, res.userName);
                // 储存登录信息
                await this._extensionContext.secrets.store(MainAuthenticationProvider.secretKey, res.uuids);
                commands.executeCommand('setContext', 'fbcode.isLogin', true);
                // 提示登录
                window.showInformationMessage(l10n.t(`Hello {name}`, { name: res.userName }));
                this._onDidChangeSessions.fire({
                    removed: [],
                    added: [ newSession ],
                    changed: []
                });
                return newSession;
            });
        });
    }


    // 退出用户登录
    async removeSession(): Promise<void> {
        // 获取当前session
        const [ session ] = await this.getSessions();
        // 存在本地缓存时，清梦本地缓存
        if (session) {
            await this._extensionContext.secrets.delete(MainAuthenticationProvider.secretKey); // 删除 token
            await this.authService.logout(session.accessToken, session.account.id);
            commands.executeCommand('setContext', 'fbcode.isLogin', false);
            // 抛出退出事件
            this._onDidChangeSessions.fire({
                removed: [ session ],
                added: [],
                changed: []
            });
        }
    }

    // 获取用户登录，验证登录
    async getSessions(_scopes: any = null): Promise<AuthenticationSession[]> {
        // 查看缓存信息是否存在
        const accessToken = await this._extensionContext.secrets.get(MainAuthenticationProvider.secretKey);
        // 不存在返回空
        if (!accessToken) {
            commands.executeCommand('setContext', 'fbcode.isLogin', false);
            return [];
        }
        // 存在交换完整个信息，返回完整session
        return this.authService.getUserInfo(accessToken).then( async res => {
            if (res) {
                commands.executeCommand('setContext', 'fbcode.isLogin', true);
                return [new AuthSession(accessToken, res?.account, res?.userName)];
            } else {
                // 本地 token 在服务端不存在关联信息
                commands.executeCommand('setContext', 'fbcode.isLogin', false);
                await this._extensionContext.secrets.delete(MainAuthenticationProvider.secretKey);
                return [];
            }
        });
    }
}