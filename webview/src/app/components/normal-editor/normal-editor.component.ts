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
      if (this.editor.state.doc.toString() !== this.content()) {
        this.setValue(this.content());
      }
    }, { allowSignalWrites: true });
  }

  ngAfterViewInit() {
    this.editor = new EditorView({
      doc: '',
      extensions: [
        minimalSetup,
        ...this.extensions()
      ],
      parent: this.host.nativeElement
    });
  }

  // 设置全量文本
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
