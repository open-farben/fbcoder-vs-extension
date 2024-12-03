import { Injectable } from "@angular/core";
import { filter, map, Subject } from "rxjs";
import { vscode } from "../utils/vscode";

export interface MessageModel {
    type: string;
    msg: string;
    data?: any;
}
const messageListeners: Array<{ type: string, ori: (data: any) => void, com: any }> = [];
@Injectable({ providedIn: 'root' })
export class MessageService {

    // 接收消息
    public received$ = new Subject<MessageModel>();

    constructor() {
        window.addEventListener("message", (e: MessageEvent) => { 
            this.received$.next(e.data);
        });
    }

    addListener(component: any) {
        messageListeners.filter(item => item.com.constructor === component.constructor)
                        .forEach( data => this.receive(data.type).subscribe( res => data.ori.apply( component, [ res ])));
    }

    send(data: MessageModel) {
        // 发送消息体 注册到消息队列
        vscode.postMessage(data);
    }

    // socket接收方法
    receive(type: string) {
        return this.received$.pipe(
            // 只返回对应类型的消息
            filter(message => message.type === type),
            // 其它验证条件(消息不能为空)
            // filter(message => !!message.msg),
            map(message => message.data)
        );
    }
}

export function MessageListeners(type: string) {
    return (com: any, t: any, describle: PropertyDescriptor) => {
        let ori = describle.value;
        messageListeners.push( { type, ori, com } );
    };
}