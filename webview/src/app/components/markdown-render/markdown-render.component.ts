import { Component, computed, effect, ElementRef, inject, input } from '@angular/core';
import { Converter, extension } from 'showdown';
import highlight from 'highlight.js';

// 定义代码高亮插件
extension('CodeHighlight', function() {
  var matches: { code: string, language: string }[] = [];
  return [
    { 
      type: 'lang',
      regex: /``[`]{1,3}(\w*)\n([^```]+?)``[`]{1,3}/gi,
      replace: function(all: string, language: string, code: string) {
        matches.push({ code, language });
        var n = matches.length - 1;
        return '%PLACEHOLDER' + n + '%\n';
      }
    },
    {
      type: 'output',
      filter: function (text) {
        for (var i=0; i< matches.length; ++i) {
          var pat = '<p>%PLACEHOLDER' + i + '% *<\/p>';
          const highlightDom = highlight.highlight(matches[i].code, { language: matches[i].language });
          text = text.replace(new RegExp(pat, 'gi'), `<pre><code class="hljs">${highlightDom.value}</code></pre>`);
        }
        matches = [];
        return text;
      }
    }
  ];
});

@Component({
  selector: 'app-markdown-render',
  standalone: true,
  imports: [],
  templateUrl: './markdown-render.component.html',
  styleUrl: './markdown-render.component.scss'
})
export class MarkdownRenderComponent {
  content = input('');
  converter = new Converter({ extensions: ['CodeHighlight'] });
  host = inject(ElementRef);
  constructor() {
    effect(() => {
      this.host.nativeElement.innerHTML = computed(() => this.converter.makeHtml(this.content()))();
    });
  }
}