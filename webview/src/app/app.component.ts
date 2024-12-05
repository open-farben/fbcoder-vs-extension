import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MessageListeners, MessageModel, MessageService } from './service/message-service';
import { IntelligentAnsweringComponent } from './views/intelligent-answering/intelligent-answering.component';
import { CodeTranslateComponent } from './views/code-translate/code-translate.component';
import { ConfigService } from './service/config-service';
import { CodeSearchComponent } from "./views/code-search/code-search.component";

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    IntelligentAnsweringComponent,
    CodeTranslateComponent,
    CodeSearchComponent
  ],
})
export class AppComponent {

  readonly msg = inject(MessageService);
  readonly config = inject(ConfigService);

  /**
   * 是否需要权限
   */
  needLogin = signal(true);
  /**
   * 是否已经登陆
   */
  isLogin = signal(false);
  /**
   * 是否网络错误
   */
  netWorkError = signal(false);
  /**
   * 版本过期
   */
  versionExpired = signal(false);

  userInfo!: { userName: string, userId: string };

  constructor() {
    this.msg.addListener(this);
  }

  ngAfterViewInit() {
    this.msg.send({ type: 'webview-init-finished', msg: '通知 vscode webview已经准备就绪。' });
  }

  // 用户信息变更
  @MessageListeners("user-change")
  userChange(data: { userId: string, userName: string }) {
    this.isLogin.update(() => !!data);
    if (data) {
      this.userInfo = data;
    }
  }

  // 初始化页面
  @MessageListeners("code-config-init")
  initPage(data: {
    apiPrefix: string,
    modelSwitching: string,
    session: string,
    version: string,
    apiUrl: string,
    cacheTaskList: MessageModel[],
    versionExpired: boolean
  }) {
    for (const key in this.config.config) {
      if (this.config.config.hasOwnProperty(key)) {
        Object.assign(this.config.config, { [key]: (data as { [key: string]: any })[key] });
      }
    }
    // if (data.versionExpired) {
    //   this.versionExpired.update(() => true);
    // }
    // 设置服务端信息
    if (data.cacheTaskList && data.cacheTaskList.length > 0) {
      this.msg.runQuene(data.cacheTaskList);
    }
  }

  // 配置内容变更
  @MessageListeners("config-change")
  configChange(data: MessageModel) {
    console.log(data);
  }

  // 版本过期
  @MessageListeners("version-expired")
  versionExpir() {
    console.log('版本过期');
    this.versionExpired.update(() => true);
  }

  // 验证网格错误
  @MessageListeners("net-error")
  netError() {
    this.netWorkError.update(() => true);
  }

  goForlogin() {
    this.msg.send({
      type: "run-command",
      msg: '去登陆',
      data: "fbcoder.go-for-login"
    });
  }

  handleDownload() {
    this.msg.send({
      type: "code.downLoad",
      msg: '去下载',
    });
  }

  refresh() {
    this.msg.send({
      type: 'run-command',
      msg: '刷新界面',
      data: "workbench.action.reloadWindow"
    });
  }
}