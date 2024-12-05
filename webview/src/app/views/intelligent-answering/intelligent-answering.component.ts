import { Component, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { IntelligentTextAreaComponent } from '../../components/intelligent-text-area/intelligent-text-area.component';
import { MarkdownRenderComponent } from "../../components/markdown-render/markdown-render.component";
import { MessageListeners, MessageService } from '../../service/message-service';
import { ShowSelectedCodeComponent } from "../../components/show-selected-code/show-selected-code.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Base64 } from '../../utils/base64';
import { ConfigService } from '../../service/config-service';
import { ApiService } from '../../service/api-service';

// 智能问答
@Component({
  selector: 'app-intelligent-answering',
  standalone: true,
  imports: [IntelligentTextAreaComponent, MarkdownRenderComponent, ShowSelectedCodeComponent, MatButtonModule, MatIconModule],
  templateUrl: './intelligent-answering.component.html',
  styleUrl: './intelligent-answering.component.scss'
})
export class IntelligentAnsweringComponent {
  readonly config = inject(ConfigService);
  readonly api = inject(ApiService);
  /**
   * 用户信息
   */
  userInfo = input<{ userName: string, userId: string }>();
  /**
   * 输入框内容
   */
  codeContent = signal('');
  /**
   * 选中代码的语言种类
   */
  selectedCodeLang = signal('');
  /**
   * 用户选中代码块
   */
  selectedCode = signal('');
  /**
   * 对话列表
   */
  dialogs = signal<{question: string, answer: string}[]>([]);
  /**
   * 对话列表 Dom
   */
  dialogDom = viewChild<ElementRef>('dialogDom');
  /**
   * 正在接收内容
   */
  isReceiving = signal(false);

  endSignal = '<|endoftext|>';

  scrollAnimation!: number;

  recommendList = [];

  readonly msg = inject(MessageService);

  constructor() {
    effect(() => {
      if (this.isReceiving()) {
        const scrollBottom = () => {
          const dom = this.dialogDom();
          if (dom) {
            dom.nativeElement.scrollTo({
              left: 0,
              top: dom.nativeElement.scrollHeight,
              behavior: 'smooth'
            });
          }
          this.scrollAnimation = requestAnimationFrame(scrollBottom);
        };
        scrollBottom();
      } else {
        cancelAnimationFrame(this.scrollAnimation);
      }
    });
  }
  
  ngOnInit() {
    // 初始化监听
    this.msg.addListener(this);
  }

  // 用户选中代码展示在代码问答区
  @MessageListeners("code-selected")
  showCode(data: { code: string, language: string }) {
    this.selectedCode.update(() => data.code);
    this.selectedCodeLang.update(() => data.language);
  }

  // 用户选中代码，执行单元测试
  @MessageListeners("code-test")
  codeTest(data: { code: string, lang: string }) {
    this.codeContent.set('/单元测试 请帮下面代码创建一个单元测试');
    console.log(data.lang);
    this.selectedCode.update(() => data.code);
    this.selectedCodeLang.update(() => data.lang);

    this.sendMessage();
  }

  // 用户选中代码，执行代码修复
  @MessageListeners("code-explain")
  codeExplain(data: { code: string, lang: string }) {
    console.log("代码解释")
    this.codeContent.set('/行间注释 请逐行注释以下代码：');
    console.log(data.lang);
    this.selectedCode.update(() => data.code);
    this.selectedCodeLang.update(() => data.lang);

    this.sendMessage();
  }

  // 用户选中代码，执行代码修复
  @MessageListeners("code-repeir")
  codeRepeir(data: { code: string, lang: string }) {
    this.codeContent.set('/代码纠正 请纠正下列代码的错误：');
    console.log(data.lang);
    this.selectedCode.update(() => data.code);
    this.selectedCodeLang.update(() => data.lang);

    this.sendMessage();
  }

  @MessageListeners("clear-dialog")
  clearDialog() {
    this.dialogs.update(() => []);
    this.recommendList = [];
  }

  ngAfterViewInit() {

  }

  sendMessage(msg: string = '') {
    this.isReceiving.update(() => true);
    let requestUrl = 'answerx';
    let message = '';
    const headers = {
      "Model": this.config.config.modelSwitching || 'fmcoder',
      "Uuid": this.config.config.session,
      "Version": "vscode:" + this.config.config.version,
    };
    let inputContent = msg || this.codeContent();
    let selectedCode = this.selectedCode() ? "```" + this.selectedCodeLang() + "\n" + this.selectedCode() + "\n```" : '';
    // 每次对话时WS传递的报文
    let postBody: any = {
      model: this.config.config.modelSwitching || 'fmcoder',
      prompt: inputContent + "\n\n" + selectedCode,
    };
    if (inputContent.startsWith('/代码纠正')) {
      requestUrl = 'repair';
      postBody.lang = this.selectedCodeLang();
      postBody.prompt = postBody.prompt.replace('/代码纠正', '');
    }
    if (inputContent.startsWith('/单元测试')) {
      requestUrl = 'testcase';
      postBody.lang = this.selectedCodeLang();
      postBody.prompt = postBody.prompt.replace('/单元测试', '');
    }
    if (inputContent.startsWith('/行间注释')) {
      requestUrl = 'comment';
      postBody.lang = this.selectedCodeLang();
      postBody.prompt = postBody.prompt.replace('/行间注释', '');
    }
    
    // 正在接收内容
    this.isReceiving.update(() => true);
    const currentIndex = this.dialogs().push({ question: postBody.prompt, answer: '正在思考...' });
    // 代码相关时 添加语言字段
    const authorization = Base64.encode(JSON.stringify(headers));
    const wsurl = `${this.config.config.apiUrl.replace('http', 'ws')}${this.config.config.apiPrefix}/websocket/${requestUrl}?authorization=${authorization}`;
    const ws = new WebSocket(wsurl);

    ws.onopen = (event) => {
      ws.send(JSON.stringify(postBody));
      this.api.getNextQuestion(postBody.prompt).subscribe( (res: any) => {
        console.log(res);
        this.recommendList = res.result;
      });
      this.codeContent.update(() => '');
      this.selectedCode.update(() => '');
    };

    ws.onmessage = (event) => {
      // 获取序列号
      if (event.data.trim().startsWith("{\"Serial-Number\"")) {
        const { ['Serial-Number']:serialNumber } = JSON.parse(event.data);
        if (serialNumber) {
          return;
        }
      };
      if (event.data.trim().indexOf(this.endSignal) > -1) {
        ws.close();
        return;
      }
      message += event.data.replace(/\|A\|/g, '\n');
      this.dialogs()[currentIndex - 1].answer = message;
    };

    ws.onclose = (event) => {
      setTimeout(() => {
        this.isReceiving.update(() => false);
      }, 100);
    };

    ws.onerror = (event) => {
      this.isReceiving.update(() => false);
    };
  }

  closeMessage() {

  }

  copyText(str: string) {
    this.msg.send({
      type: "code.copy",
      msg: "复制文本",
      data: str
    });
  }

  openIntroducPage() {
    this.msg.send({
      type: "code.introduce",
      msg: '打开介绍页',
    });
  }
}
