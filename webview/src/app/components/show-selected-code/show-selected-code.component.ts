import { Component, input, model, signal } from '@angular/core';
import { NormalEditorComponent } from "../normal-editor/normal-editor.component";
import { EditorView } from '@codemirror/view';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EditorState, Compartment } from "@codemirror/state";
import { htmlLanguage, html } from "@codemirror/lang-html";
import { language } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";

@Component({
  selector: 'app-show-selected-code',
  standalone: true,
  imports: [NormalEditorComponent, MatIconModule, MatButtonModule],
  templateUrl: './show-selected-code.component.html',
  styleUrl: './show-selected-code.component.scss'
})
export class ShowSelectedCodeComponent {
  code = model('');
  extensions: any[] = [];

  constructor() {
    // 主题样式
    const baseTheme = EditorView.theme({
      "&.cm-editor": {
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0, .5)"
      }
    });
    const languageConf = new Compartment();

    const autoLanguage = EditorState.transactionExtender.of(tr => {
      if (!tr.docChanged) { return null; }
      let docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100));
      let stateIsHTML = tr.startState.facet(language) === htmlLanguage;
      if (docIsHTML === stateIsHTML) { return null; }
      return {
        effects: languageConf.reconfigure(docIsHTML ? html() : javascript())
      };
    });
    this.extensions = [ baseTheme, languageConf.of(javascript()), autoLanguage ];
  }

  clearContent() {
    this.code.set('');
  }
}
