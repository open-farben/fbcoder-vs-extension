import { Component, effect, ElementRef, inject, input, model } from '@angular/core';
import { EditorView } from '@codemirror/view';
import { minimalSetup } from 'codemirror';

@Component({
  selector: 'app-normal-editor',
  standalone: true,
  imports: [],
  templateUrl: './normal-editor.component.html',
  styleUrl: './normal-editor.component.scss'
})
export class NormalEditorComponent {
  host = inject(ElementRef);
  editor!: EditorView;
  extensions = input<any[]>([]);
  content = model('');
  constructor() {
    effect(() => {
      // 当 content，主动变更时 值变更时更新插件的值，父级流入内容
      if (this.editor.state.doc.toString() !== this.content()) {
        this.setValue(this.content());
      }
    });
  }

  ngAfterViewInit() {
    let updateListenerExtension = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (update.state.doc.toString() !== this.content()) {
          // 编辑器文档发生变化时执行的代码
          this.content.update(() => update.state.doc.toString());
        }
      }
    });
    this.editor = new EditorView({
      doc: '',
      extensions: [
        minimalSetup,
        updateListenerExtension,
        ...this.extensions()
      ],
      parent: this.host.nativeElement
    });
  }

  // 设置插件文本内容
  setValue(value: string) {
    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.toString().length,
        insert: value
      }
    });
  }
}
