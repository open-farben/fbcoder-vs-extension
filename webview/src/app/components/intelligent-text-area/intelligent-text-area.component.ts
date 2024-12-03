import { Component, model } from '@angular/core';
import { Decoration, DecorationSet, EditorView, MatchDecorator, placeholder, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { autocompletion } from "@codemirror/autocomplete";
import { NormalEditorComponent } from "../normal-editor/normal-editor.component";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// 复合输入框
@Component({
  selector: 'app-intelligent-text-area',
  standalone: true,
  imports: [ NormalEditorComponent,  MatIconModule, MatButtonModule ],
  templateUrl: './intelligent-text-area.component.html',
  styleUrl: './intelligent-text-area.component.scss'
})
export class IntelligentTextAreaComponent {
  extensions: any[] = [];
  content = model('');
 
  constructor() {
    // 主题样式
    const baseTheme = EditorView.theme({
      "&": {
        width: "100%",
        height: "100%"
      },
      "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        backgroundColor: "var(--vscode-editor-selectionBackground)"
      },
      "& .cm-selectionBackground" : {
        backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)"
      },
      "& .cm-cursor": {
        borderColor: "var(--vscode-editorCursor-foreground)"
      },
      "& .cm-tooltip.cm-completionInfo": {
        borderRadius: "4px",
        color: "var(--vscode-breadcrumb-foreground)",
        borderColor: "var(--vscode-editorHoverWidget-border)",
        backgroundColor: "var(--vscode-editor-background)"
      },
      "& .cm-tooltip-autocomplete": {
        borderRadius: "4px",
        borderColor: "var(--vscode-editorHoverWidget-border)",
        backgroundColor: "var(--vscode-editor-background)"
      }
    });
    // 提及 逻辑
    const placeholderMatcher = new MatchDecorator({
      regexp: /^\/(代码解释|行间注释|代码纠正|单元测试)/g,
      decoration: match => Decoration.replace({
        widget: new PlaceholderWidget(match[1]),
      })
    });
    const placeholders = ViewPlugin.fromClass(class {
      placeholders: DecorationSet;
      constructor(view: EditorView) {
        this.placeholders = placeholderMatcher.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.placeholders = placeholderMatcher.updateDeco(update, this.placeholders);
      }
    }, {
      decorations: instance => instance.placeholders,
      provide: plugin => EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.placeholders || Decoration.none;
      })
    });

    // 指定补全提示
    const completions = [
      { label: "/代码解释", type: "keyword", info: "为选中代码生成代码解释" },
      { label: "/行间注释", type: "keyword", info: "为选中代码生成逐行注释" },
      { label: "/代码纠正", type: "keyword", info: "为选中代码生成纠正、优化建议" },
      { label: "/单元测试", type: "keyword", info: "为选中代码生成单元测试" },
    ];
    
    function myCompletions(context: any) {
      let before = context.matchBefore(/^\/.*/);
      if (!context.explicit && !before) { return null; };
      return {
        from: before ? before.from : context.pos,
        options: completions,
        validFor: /^.*$/
      };
    };

    let updateListenerExtension = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        console.log(update);
        if (update.state.doc.toString() !== this.content()) {
          // 编辑器文档发生变化时执行的代码
          this.content.update(() => update.state.doc.toString());
        }
      }
    });

    this.extensions = [
      placeholders,
      baseTheme,
      autocompletion({ override: [ myCompletions ]}),
      placeholder('请输入问题，向大模型提问'),
      EditorView.lineWrapping,
      updateListenerExtension,
    ];
  }
}

export class PlaceholderWidget extends WidgetType {
  name: string;
  constructor(name: string) {
    super();
    this.name = name;
  }
  
  toDOM() {
    let elt = document.createElement("span");
    elt.style.cssText = `
      border-radius: 4px;
      padding: 0 3px;
      color: var(--vscode-activityBarBadge-foreground);
      background-color: var(--vscode-activityBarBadge-background);`;
    elt.textContent = `/${this.name}`;
    return elt;
  }
}