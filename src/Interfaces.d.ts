import { ClientType } from '@wireapp/api-client/lib/client/';
export interface BotConfig {
    /** Set the backend (staging or production) */
    backend?: 'production' | 'staging';
    /** Set the client type (permanent or temporary). */
    clientType?: ClientType;
    /** Set allowed conversations (if empty, all conversations are allowed). */
    conversations?: string[];
    /** Set allowed message owners (if empty, all users are allowed). */
    owners?: string[];
}
export interface BotCredentials {
    /** Your bot's email address on Wire. */
    email: string;
    /** Your bot's password on Wire. */
    password: string;
}
//# sourceMappingURL=Interfaces.d.ts.map