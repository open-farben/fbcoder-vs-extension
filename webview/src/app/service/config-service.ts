import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class ConfigService {
    config: { apiPrefix: string,
        modelSwitching: string, apiUrl: string, session: string, version: string, versionExpired: boolean } = {
        apiPrefix: '',
        modelSwitching: '',
        apiUrl: '',
        session: '',
        version: '',
        versionExpired: false
    };;
    constructor() {
    }
}