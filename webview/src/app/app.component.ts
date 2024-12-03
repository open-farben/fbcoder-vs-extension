import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MessageListeners, MessageModel, MessageService } from './service/message-service';
import { IntelligentAnsweringComponent } from './views/intelligent-answering/intelligent-answering.component';
import { CodeTranslateComponent } from './views/code-translate/code-translate.component';
import { ConfigService } from './service/config-service';

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
    CodeTranslateComponent
],
})
export class AppComponent {

  readonly msg = inject(MessageService);
  readonly config = inject(ConfigService);

  ngOnInit(): void {
    this.msg.addListener(this);
    this.msg.send({ type: 'webview-init-finished', msg: '通知 vscode webview已经准备就绪。' });
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
        Object.assign(this.config.config, { [key]: (data as { [key: string]: any})[key] });
      }
    }
    // 设置服务端信息
    if (data.cacheTaskList && data.cacheTaskList.length > 0) {
      data.cacheTaskList.forEach((messageData) => {
        this.msg.received$.next(messageData);
      });
    }
  }

  // 配置内容变更
  @MessageListeners("config-change")
  configChange(data: MessageModel) {
    console.log(data);
  }

  // 版本过期
  @MessageListeners("version-expired")
  versionExpired() {
    console.log('版本过期');
  }
}