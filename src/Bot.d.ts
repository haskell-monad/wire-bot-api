import { APIClient } from '@wireapp/api-client';
import { Cookie } from '@wireapp/api-client/lib/auth';
import { ConversationEvent, TeamEvent, UserEvent } from '@wireapp/api-client/lib/event';
import { Account } from '@wireapp/core';
import { PayloadBundle } from '@wireapp/core/lib/conversation/';
import { CRUDEngine } from '@wireapp/store-engine';
import { BotConfig, BotCredentials } from './Interfaces';
import { MessageHandler } from './MessageHandler';
export declare class Bot extends MessageHandler {
    private readonly credentials;
    account: Account | undefined;
    private readonly config;
    private readonly handlers;
    private readonly logger;
    constructor(credentials: BotCredentials, config?: BotConfig);
    addHandler(handler: MessageHandler): void;
    removeHandler(key: string): void;
    private isAllowedConversation;
    private isOwner;
    start(storeEngine?: CRUDEngine): Promise<APIClient>;
    getCookie(storeEngine: CRUDEngine): Promise<Cookie | undefined>;
    handleEvent(payload: PayloadBundle | ConversationEvent | UserEvent | TeamEvent): void;
    private validateMessage;
}
//# sourceMappingURL=Bot.d.ts.map