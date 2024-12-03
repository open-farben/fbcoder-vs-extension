import {
	CancellationToken,
	commands,
	ExtensionContext,
	InlineCompletionContext,
	InlineCompletionItemProvider,
	InlineCompletionList,
	Position,
	Range,
	Selection,
	TextDocument,
	TextDocumentContentChangeEvent,
	workspace
} from "vscode";
import { CompletionService } from "../service/completion.service";
import { Trie } from "../utils/trie";
import { MessagesCenter } from "../messagesCenter";

export class InlineCompletionProvider implements InlineCompletionItemProvider {
	// 抖动
	debounceTimeout: NodeJS.Timeout | string | number | undefined;
	// 补全服务
	completionService!: CompletionService;
	// 当前输入变动事件
	currentChange!: TextDocumentContentChangeEvent[];
	// 当前操作是否由补全内容产生
	isCompletionChange: boolean = false;
	// 每次插件启动时初始化特瑞树，用于缓存推荐过的内容
	trie = new Trie([]);
	// 将请求过的提示词缓存起来，避免重复请求
	prompts: Set<string> = new Set();
	// 是否为按建触发
	isActiveTrigger: Boolean = false;
	// 重新获取其它答案
	reGetCompletion: Boolean = false;

	constructor(private msg: MessagesCenter, private _extensionContext: ExtensionContext) {
		this.completionService = new CompletionService();
		// 监听用户的输入模式 与 输入内容
		workspace.onDidChangeTextDocument(event => {
			this.currentChange = [...event.contentChanges];
		});
		_extensionContext.subscriptions.push(
			// 使用按键获取结果
			commands.registerCommand("fbcoder.new-completions", async () => {
				this.isActiveTrigger = true;
				await commands.executeCommand('editor.action.inlineSuggest.hide');
				await commands.executeCommand('editor.action.inlineSuggest.trigger');
			}),
			// 使用按键获最下一个推荐答案
			commands.registerCommand("fbcoder.next-completions", async () => {
				this.reGetCompletion = true;
				await commands.executeCommand('editor.action.inlineSuggest.hide');
				await commands.executeCommand('editor.action.inlineSuggest.trigger');
			}),
			// 使用按键获最上一个推荐答案
			commands.registerCommand("fbcoder.previous-completions", async () => {
				this.reGetCompletion = true;
				await commands.executeCommand('editor.action.inlineSuggest.hide');
				await commands.executeCommand('editor.action.inlineSuggest.trigger');
			})
		);
	}
	async provideInlineCompletionItems(document: TextDocument, position: Position, context: InlineCompletionContext, token: CancellationToken) {
		// 查看配置是否自动提示
		const configuration = workspace.getConfiguration("fbcoder");
		const _onlyKeyControl = configuration.get('OnlyKeyControl', false);
		// 非主动提示，只有按键时才会触发
		if (_onlyKeyControl && !this.isActiveTrigger) {
			// 非自动提示
			console.log("非自动提示");
			return;
		}
		
		// 抖动 500ms
		await new Promise((resolve) => {
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = setTimeout(() => {
				resolve(true);
			}, 300);
		});
		// 实时获取
		if (position.line <= 0) {
			// 当代码处于一行时，因为没有上文，所有推理提示的意义不大
			return;
		}
		if (this.currentChange.length > 1) {
			// 用户处于多行同时输入模式 目前没有多行同时处理的能力
			return;
		}
		// 处理补全时用户的输入内容
		const [{ text: userInput }] = this.currentChange;
		if (userInput === '\n') {
			console.log('输入了换行');
		}
		const result: InlineCompletionList = {
			items: [],
			commands: [],
		};
		if (context.selectedCompletionInfo) {
			// 这是用户选择一般提示内容的操作，这里不需要去请求
			return;
		}
		// 这两种模式可能会同时调用，在这里需要做截流
		if (context.triggerKind === 1) {
			// 这里是默认提示 只需要推送最优的方案即可
		} else {
			// 用户想查看是否有其它的记录 此时应该显示所有备选项。
		}
		this.msg.trigger({ type: 'LOADING_INFO', data: '正在加载...' });
		// 所有上文
		const selection = new Selection(0, 0, position.line, position.character);
		// 上文内容
		let textBeforeCursor = document.getText(selection);

		const lastLine = document.lineAt(document.lineCount - 1);
		const endPosition = lastLine.range.end;
		const textAfterCursorSelection = new Selection(position, endPosition);
		// 下文内容
		let textAfterCursor = document.getText(textAfterCursorSelection);
		if (!this.reGetCompletion) {
			// 查看内容是否已经请求过
			for (let prompt of this.prompts) {
				if (textBeforeCursor.indexOf(prompt) !== -1) {
					// 获取之前请求结果
					let cacheText = this.trie.getPrefix(document.uri.path + textBeforeCursor);
					if (!cacheText.length) {
						console.log('缓存内容为空，继续请求。');
						break;
					}
					cacheText.forEach(text => {
						const insertText = text.replace(document.uri.path + textBeforeCursor, '');
						console.log('使用缓存回答', insertText);
						result.items.push({
							insertText,
							range: new Range(position, position),
							completeBracketPairs: false,
							// 这里是用户接受当前提示后，自动调用的命令
							command: {
								title: '',
								tooltip: '补全这个',
								command: 'fbcoder.completion-accept',
								arguments: [insertText]
							}
						});
					});
					this.msg.trigger({ type: 'SHOW_TEXT', data: '完成' });
					return result;
				}
			}
		}

		// 使用上文请求服务器 返回提示内容
		return this.completionService.GetCodeCompletions(textBeforeCursor, textAfterCursor, document.languageId, this.reGetCompletion ? 0.8 : 0.95).then(
			res => {
				this.msg.trigger({ type: 'SHOW_TEXT', data: '完成' });
				// 标记上文 已经请求过
				this.prompts.add(textBeforeCursor);
				// 缓存请求结果
				this.trie.addWord(document.uri.path + textBeforeCursor + res[0]);
				result.items.push({
					insertText: res[0],
					range: new Range(position, position),
					completeBracketPairs: false,
					// 这里是用户接受当前提示后，自动调用的命令
					command: {
						title: '',
						tooltip: '补全这个',
						command: 'fbcoder.completion-accept',
						arguments: res
					}
				});
				return result;
			}
		);
	}
}
