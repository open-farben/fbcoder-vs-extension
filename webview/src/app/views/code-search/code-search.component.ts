import { Component, ElementRef, inject } from '@angular/core';
import {basicSetup, EditorView} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"

@Component({
  selector: 'app-code-search',
  standalone: true,
  imports: [],
  templateUrl: './code-search.component.html',
  styleUrl: './code-search.component.scss'
})
export class CodeSearchComponent {
  host = inject(ElementRef);
  constructor() {
    new EditorView({
      doc: "console.log('hello')\n",
      extensions: [ basicSetup, javascript(), EditorView.domEventHandlers({
        paste(event: any, view) {
          console.log(event, view);
            if (event.clipboardData?.items?.[0]?.type?.startsWith('image')) {
                const file = event.clipboardData.items[0].getAsFile()!;
            }
        },
        drop(event: any, view) {
            if (event.dataTransfer?.items?.[0]?.type?.startsWith('image')) {
                const file = event.dataTransfer?.items?.[0]?.getAsFile()!;
            }
        }
    })
  ],
      parent: this.host.nativeElement
    });
  }
}
