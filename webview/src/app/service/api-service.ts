import { HttpClient } from "@angular/common/http";
import { ConfigService } from "./config-service";
import { inject, Injectable } from "@angular/core";

@Injectable({providedIn:'root'})
export class ApiService {
    private http = inject(HttpClient);
    private config = inject(ConfigService);

    // 下一步提问推理
    getNextQuestion(inputStr: string, type: string = 'llm_model/chat') {
        return this.http.post(`${this.config.config.apiUrl}/${type}/next_question`, { query: inputStr }, { headers: {
            "uuid": this.config.config.session,
            "version": "vscode:" + this.config.config.version
        }});
    }
}