import { EventEmitter } from "vscode";

interface MessageModel {
    type: string,
    data: any
}

export class MessagesCenter extends EventEmitter<MessageModel> {
  eventQueueSet: Map<string, (data: any) => void> = new Map();
  constructor() {
    super();
    this.event((data: MessageModel) => {
      const fn = this.eventQueueSet.get(data.type);
      fn && fn(data.data);
    });
  }

  // 触发自定义事件
  trigger(data: MessageModel) {
    this.fire(data);
  }

  // 触发自定义事件
  subscribe(type: string, fun: (data: any) => void) {
    this.eventQueueSet.set(type, fun);
  }
}