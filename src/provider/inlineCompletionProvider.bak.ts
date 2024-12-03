import {
    CancellationToken,
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionItemProvider,
    InlineCompletionList,
    PartialAcceptInfo,
    Position,
    ProviderResult,
    Range,
    SnippetString,
    TextDocument
} from "vscode";

export class InlineCompletionProvider implements InlineCompletionItemProvider {
    constructor() {}
    provideInlineCompletionItems(document: TextDocument, position: Position, context: InlineCompletionContext, token: CancellationToken): ProviderResult<InlineCompletionItem[] | InlineCompletionList> {
		const regexp = /\/\/ \[(.+?),(.+?)\)(.*?):(.*)/;
		if (position.line <= 0) {
			console.log('第一行时不提示。');
			return;
		}

		const result: InlineCompletionList = {
			items: [],
			commands: [],
		};

		let offset = 1;
		while (offset > 0) {
			if (position.line - offset < 0) {
				break;
			}
			// 当前光标的上一行内容
			const lineBefore = document.lineAt(position.line - offset).text;
			const matches = lineBefore.match(regexp);
			if (!matches) {
				break;
			}
			offset++;

			const start = matches[1];
			const startInt = parseInt(start, 10);
			const end = matches[2];
			const endInt = end === '*' ? document.lineAt(position.line).text.length : parseInt(end, 10);
			const flags = matches[3];
			// 是否对内容进行补全括号
			const completeBracketPairs = flags.includes('b');
			// 内容是否为片段代码，
			const isSnippet = flags.includes('s');
			// 转换换行符
			const text = matches[4].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
			// 关于 Range 必须是同一行，如果 开始与结束不相同时为替换，相同时为插入
			// 插入时可以在任意有字符的位置
			// 替换时只能替换空字符串，如果范围内有非空字符，就不会提示补全
			// 如果行内长度不满足 Range 范围也不会提示
			result.items.push({
				insertText: isSnippet ? new SnippetString(text) : text,
				range: new Range(position.line, startInt, position.line, endInt),
				completeBracketPairs,
				command: {
					title: '',
					tooltip: '补全这个',
					command: 'fbcoder.completion-accept',
					arguments: [text]
				}
			});
		}

		// 给补全对话框添加一个自定义命令
		if (result.items.length > 0) {
			result.commands!.push({
				command: 'demo-ext.command1',
				title: 'My Inline Completion Demo Command',
				arguments: [1, 2],
			});
		}
		return result;
    }

	// 显示补全
    handleDidShowCompletionItem(completionItem: InlineCompletionItem, updatedInsertText: string): void {
        //console.log('显示补全对像', completionItem);
        //console.log('更新后文字（实际要插入的文字）', updatedInsertText);
    }

	// 接收部分补全内容，每次调整都会调用
    handleDidPartiallyAcceptCompletionItem(
        completionItem: InlineCompletionItem,
		// 会调用两次，一次提示接收的类型，一次展示接收的长度
        info: PartialAcceptInfo | number
    ): void { 
		console.log('接收到部分内容', info, completionItem);
        // console.log('handleDidPartiallyAcceptCompletionItem');
    }
    provideInlineEditsForRange(document: TextDocument, range: Range, context: InlineCompletionContext, token: CancellationToken): ProviderResult<InlineCompletionItem[] | InlineCompletionList> {
		console.log('新的回调');
		const result: InlineCompletionList = {
			items: [],
			commands: [],
		};
		return result;
	}
}