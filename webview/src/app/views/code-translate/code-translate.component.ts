import { Component, inject, signal } from '@angular/core';
import { MessageListeners, MessageService } from '../../service/message-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NormalEditorComponent } from "../../components/normal-editor/normal-editor.component";
import { EditorView } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { htmlLanguage, html } from "@codemirror/lang-html";
import { language } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";

const languageConf = new Compartment();
// 代码转换
@Component({
  selector: 'app-code-translate',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule, FormsModule, ReactiveFormsModule, NormalEditorComponent],
  templateUrl: './code-translate.component.html',
  styleUrl: './code-translate.component.scss'
})
export class CodeTranslateComponent {
  /**
   * 选中代码的语言种类
   */
  selectedCodeLang = signal('');
  /**
   * 用户选中代码块
   */
  targetLang = new FormControl('');
  selectedCode = signal('');
  translateCode = signal('');
  // 转换中
  isRunning = signal(false);
  extensions: any[] = [
    EditorView.theme({
      "&.cm-editor": {
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,.5)",
        borderRadius: '4px'
      }
    }),
    languageConf.of(javascript()),
    EditorState.transactionExtender.of(tr => {
      if (!tr.docChanged) { return null; }
      let docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100));
      let stateIsHTML = tr.startState.facet(language) === htmlLanguage;
      if (docIsHTML === stateIsHTML) { return null; }
      return {
        effects: languageConf.reconfigure(docIsHTML ? html() : javascript())
      };
    })
  ];

  languageList = [
    { value: 'cpp', label: 'C++', model: 'text/x-c++src' },
    { value: 'C#', label: 'C#', model: 'text/x-csharp' },
    { value: 'typescript', label: 'TypeScript', model: 'javascript' },
    { value: 'javascript', label: 'JavaScript', model: 'javascript' },
    { value: 'go', label: 'Go', model: 'go' },
    { value: 'python', label: 'Python', model: 'python' },
    { value: 'php', label: 'PHP', model: 'php' },
    { value: 'java', label: 'Java', model: 'text/x-java' },
  ];

  readonly msg = inject(MessageService);

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

  // 用户选中代码展示在代码问答区
  @MessageListeners("show-translate")
  showTranslate(data: { code: any }) {
    this.translateCode.update(() => data.code);
    this.isRunning.update(() => false);
  }

  insertCode() {
    
  }

  translate() {
    if (!this.selectedCode() || !this.targetLang.value) {
      this.msg.send({
        type: "show-message",
        msg: '展示提示',
        data: {
          type: 'Error',
          message: '请选中一段代码并选中目标代码。'
        }
      });
      return;
    }
    this.isRunning.update(() => true);
    this.msg.send({
      type: "translate-code",
      msg: '翻译给定代码',
      data: {
        code: this.selectedCode(),
        srcLang: this.selectedCodeLang(),
        dstLang: this.targetLang.value
      }
    });
  }
}
