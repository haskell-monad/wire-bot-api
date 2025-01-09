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
exports.MessageHandler = void 0;
const conversation_1 = require("@wireapp/api-client/lib/conversation");
const conversation_2 = require("@wireapp/api-client/lib/conversation");
const data_1 = require("@wireapp/api-client/lib/conversation/data");
const core_1 = require("@wireapp/core");
const protocol_messaging_1 = require("@wireapp/protocol-messaging");
const FileType = require("file-type");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
class MessageHandler {
    account = undefined;
    async addUser(conversationId, userId) {
        if (this.account?.service) {
            await this.account.service.conversation.addUsersToProteusConversation({
                conversationId,
                qualifiedUsers: [{ domain: '', id: userId }],
            });
        }
    }
    // async clearConversation(conversationId: string): Promise<void> {
    //   if (this.account?.service) {
    //     await this.account.service.conversation.clearConversation(conversationId);
    //   }
    // }
    getConversation(conversationId) {
        return this.account.service.conversation.getConversation(conversationId);
    }
    getConversations(conversationIds) {
        return this.account.service.conversation.getConversations(conversationIds);
    }
    async getUser(userId) {
        return this.account.service.user.getUser(userId);
    }
    async getUsers(userIds) {
        return this.account.service.user.getUsers(userIds);
    }
    async removeUser(conversationId, userId) {
        if (this.account?.service) {
            await this.account.service.conversation.removeUserFromConversation(conversationId, userId);
        }
    }
    async setAdminRole(conversationId, userId) {
        return this.account.service.conversation.setMemberConversationRole(conversationId, userId, conversation_2.DefaultConversationRoleName.WIRE_ADMIN);
    }
    async setMemberRole(conversationId, userId) {
        return this.account.service.conversation.setMemberConversationRole(conversationId, userId, conversation_2.DefaultConversationRoleName.WIRE_MEMBER);
    }
    async sendButtonActionConfirmation(conversationId, userId, referenceMessageId, buttonId) {
        if (this.account?.service) {
            const buttonActionConfirmationContent = {
                buttonId,
                referenceMessageId,
            };
            const buttonActionConfirmationMessage = core_1.MessageBuilder.buildButtonActionConfirmationMessage(buttonActionConfirmationContent);
            await this.account.service.conversation.send({
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                conversationId: { id: conversationId, domain: '' },
                payload: buttonActionConfirmationMessage,
                userIds: [userId],
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendCall(conversationId, content, userIds) {
        if (this.account?.service) {
            const callPayload = core_1.MessageBuilder.buildCallMessage(content);
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: callPayload,
                userIds,
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendPoll(conversationId, text, userIds) {
        if (this.account?.service) {
            const message = core_1.MessageBuilder.buildCompositeMessage({ items: [{ text: { content: text } }] });
            await this.account.service.conversation.send({
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                conversationId: { id: conversationId, domain: '' },
                payload: message,
                userIds,
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendConfirmation(conversationId, firstMessageId, userIds) {
        if (this.account?.service) {
            const confirmationPayload = core_1.MessageBuilder.buildConfirmationMessage({
                firstMessageId,
                type: protocol_messaging_1.Confirmation.Type.DELIVERED,
            });
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: confirmationPayload,
                userIds,
            });
        }
    }
    async sendConnectionRequest(userId) {
        if (this.account?.service) {
            await this.account.service.connection.createConnection({ id: userId, domain: '' });
        }
    }
    async sendConnectionResponse(userId, accept) {
        if (this.account?.service) {
            if (accept) {
                await this.account.service.connection.acceptConnection(userId);
            }
            else {
                await this.account.service.connection.ignoreConnection(userId);
            }
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendEditedText(conversationId, originalMessageId, newMessageText, newMentions, newLinkPreview, userIds) {
        if (this.account?.service) {
            const payload = {
                text: newMessageText,
                originalMessageId,
                mentions: newMentions,
            };
            const editedPayload = core_1.MessageBuilder.buildEditedTextMessage(payload);
            const editedMessage = await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: editedPayload,
                userIds,
            });
            if (newLinkPreview) {
                const editedWithPreviewPayload = core_1.MessageBuilder.buildEditedTextMessage({
                    ...payload,
                    linkPreviews: [await this.account.service.linkPreview.uploadLinkPreviewImage(newLinkPreview)],
                }, editedMessage.id);
                await this.account.service.conversation.send({
                    conversationId: { id: conversationId, domain: '' },
                    protocol: conversation_1.ConversationProtocol.PROTEUS,
                    payload: editedWithPreviewPayload,
                    userIds,
                });
            }
        }
    }
    async sendFileByPath(conversationId, filePath, userIds) {
        const data = await (0, util_1.promisify)(fs_1.default.readFile)(filePath);
        const fileType = await FileType.fromBuffer(data);
        const metadata = {
            length: data.length,
            name: path_1.default.basename(filePath),
            type: fileType ? fileType.mime : 'text/plain',
        };
        return this.sendFile(conversationId, {
            data,
        }, metadata, userIds);
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendFile(conversationId, file, metadata, userIds) {
        if (this.account?.service) {
            const metadataPayload = core_1.MessageBuilder.buildFileMetaDataMessage({
                metaData: metadata,
            });
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: metadataPayload,
                userIds,
            });
            try {
                const filePayload = core_1.MessageBuilder.buildFileDataMessage({
                    file,
                    asset: await (await this.account.service.asset.uploadAsset(file.data)).response,
                    metaData: metadata
                }, metadataPayload.messageId);
                await this.account.service.conversation.send({
                    conversationId: { id: conversationId, domain: '' },
                    protocol: conversation_1.ConversationProtocol.PROTEUS,
                    payload: filePayload,
                    userIds,
                });
            }
            catch (error) {
                const abortPayload = core_1.MessageBuilder.buildFileAbortMessage({
                    reason: protocol_messaging_1.Asset.NotUploaded.FAILED,
                }, metadataPayload.messageId);
                await this.account.service.conversation.send({
                    conversationId: { id: conversationId, domain: '' },
                    protocol: conversation_1.ConversationProtocol.PROTEUS,
                    payload: abortPayload,
                    userIds,
                });
            }
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendImage(conversationId, image, userIds) {
        if (this.account?.service) {
            const imagePayload = core_1.MessageBuilder.buildImageMessage({
                image,
                asset: await (await this.account.service.asset.uploadAsset(image.data)).response,
            });
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: imagePayload,
                userIds,
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendLocation(conversationId, location, userIds) {
        if (this.account?.service) {
            const locationPayload = core_1.MessageBuilder.buildLocationMessage(location);
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: locationPayload,
                userIds,
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendPing(conversationId, userIds) {
        if (this.account?.service) {
            const pingPayload = core_1.MessageBuilder.buildPingMessage({ hotKnock: false });
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: pingPayload,
                userIds,
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendReaction(conversationId, originalMessageId, type, userIds) {
        if (this.account?.service) {
            const reactionPayload = core_1.MessageBuilder.buildReactionMessage({ originalMessageId, type });
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: reactionPayload,
                userIds,
            });
        }
    }
    async sendQuote(conversationId, text, userIds) {
        if (this.account?.service) {
            const replyPayload = core_1.MessageBuilder.buildTextMessage({ text });
            await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: replyPayload,
                userIds,
            });
        }
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendReply(conversationId, text, userIds) {
        return this.sendQuote(conversationId, text, userIds);
    }
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    async sendText(conversationId, text, mentions, linkPreview, userIds) {
        if (this.account?.service) {
            const payload = core_1.MessageBuilder.buildTextMessage({ text, mentions });
            const sentMessage = await this.account.service.conversation.send({
                conversationId: { id: conversationId, domain: '' },
                protocol: conversation_1.ConversationProtocol.PROTEUS,
                payload: payload,
                userIds,
            });
            if (linkPreview) {
                const editedWithPreviewPayload = core_1.MessageBuilder.buildTextMessage({
                    text,
                    linkPreviews: [await this.account.service.linkPreview.uploadLinkPreviewImage(linkPreview)],
                    mentions,
                }, sentMessage.id);
                await this.account.service.conversation.send({
                    conversationId: { id: conversationId, domain: '' },
                    protocol: conversation_1.ConversationProtocol.PROTEUS,
                    payload: editedWithPreviewPayload,
                    userIds,
                });
            }
        }
    }
    async sendTyping(conversationId, status) {
        if (this.account?.service) {
            if (status === data_1.CONVERSATION_TYPING.STARTED) {
                await this.account.service.conversation.sendTypingStart(conversationId);
            }
            else {
                await this.account.service.conversation.sendTypingStop(conversationId);
            }
        }
    }
}
exports.MessageHandler = MessageHandler;
