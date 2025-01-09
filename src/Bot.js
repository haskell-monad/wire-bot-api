"use strict";
/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const api_client_1 = require("@wireapp/api-client");
const auth_1 = require("@wireapp/api-client/lib/auth");
const client_1 = require("@wireapp/api-client/lib/client/");
const core_1 = require("@wireapp/core");
const conversation_1 = require("@wireapp/core/lib/conversation/");
const logdown_1 = __importDefault(require("logdown"));
const uuid_1 = require("uuid");
const MessageHandler_1 = require("./MessageHandler");
const defaultConfig = {
    backend: 'production',
    clientType: client_1.ClientType.TEMPORARY,
    conversations: [],
    owners: [],
};
class Bot extends MessageHandler_1.MessageHandler {
    credentials;
    account = undefined;
    config;
    handlers;
    logger;
    constructor(credentials, config) {
        super();
        this.credentials = credentials;
        this.config = { ...defaultConfig, ...config };
        this.credentials = credentials;
        this.handlers = new Map();
        this.logger = (0, logdown_1.default)('@wireapp/bot-api/Bot', {
            logger: console,
            markdown: false,
        });
    }
    addHandler(handler) {
        this.handlers.set((0, uuid_1.v4)(), handler);
    }
    removeHandler(key) {
        this.handlers.delete(key);
    }
    isAllowedConversation(conversationId) {
        return this.config.conversations.length === 0 ? true : this.config.conversations.includes(conversationId);
    }
    isOwner(userId) {
        return this.config.owners.length === 0 ? true : this.config.owners.includes(userId);
    }
    async start(storeEngine) {
        const login = {
            clientType: this.config.clientType,
            email: this.credentials.email,
            password: this.credentials.password,
        };
        const apiClient = new api_client_1.APIClient({
            urls: this.config.backend === 'staging' ? api_client_1.APIClient.BACKEND.STAGING : api_client_1.APIClient.BACKEND.PRODUCTION,
        });
        apiClient.on(api_client_1.APIClient.TOPIC.ACCESS_TOKEN_REFRESH, async (accessToken) => {
            await storeEngine?.updateOrCreate(auth_1.AUTH_TABLE_NAME, auth_1.AUTH_ACCESS_TOKEN_KEY, accessToken);
        });
        const options = {
            createStore: () => Promise.resolve(storeEngine),
            nbPrekeys: 5
        };
        this.account = new core_1.Account(apiClient, options);
        for (const payloadType of Object.values(conversation_1.PayloadBundleType)) {
            this.account.removeAllListeners(payloadType);
            this.account.on(payloadType, this.handleEvent.bind(this));
        }
        try {
            if (!storeEngine) {
                throw new Error('Store engine not provided');
            }
            const cookie = await this.getCookie(storeEngine);
            await this.account.init(this.config.clientType, { cookie });
        }
        catch (error) {
            this.logger.warn('Failed to init account from cookie', error);
            await this.account.login(login);
        }
        await this.account.listen();
        this.handlers.forEach(handler => (handler.account = this.account));
        return apiClient;
    }
    async getCookie(storeEngine) {
        const { expiration, zuid } = await storeEngine.read(auth_1.AUTH_TABLE_NAME, auth_1.AUTH_COOKIE_KEY);
        const cookie = new auth_1.Cookie(zuid, expiration);
        return cookie;
    }
    handleEvent(payload) {
        if ('conversation' in payload && this.validateMessage(payload.conversation, payload.from)) {
            this.handlers.forEach(handler => handler.handleEvent(payload));
        }
    }
    validateMessage(conversationID, userID) {
        if (!this.isAllowedConversation(conversationID)) {
            this.logger.info(`Skipping message because conversation "${conversationID}" is not in the list of allowed conversations.`);
        }
        if (!this.isOwner(userID)) {
            this.logger.info(`Skipping message because sender "${userID}" is not in the list of owners.`);
        }
        return this.isAllowedConversation(conversationID) && this.isOwner(userID);
    }
}
exports.Bot = Bot;
