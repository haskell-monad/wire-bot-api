import { Conversation, QualifiedUserClients, RemoteConversations } from '@wireapp/api-client/lib/conversation';
import { CONVERSATION_TYPING } from '@wireapp/api-client/lib/conversation/data';
import { ConversationEvent, TeamEvent, UserEvent } from '@wireapp/api-client/lib/event';
import { QualifiedId, User } from '@wireapp/api-client/lib/user/';
import { Account } from '@wireapp/core';
import { PayloadBundle, ReactionType } from '@wireapp/core/lib/conversation/';
import { FileContent, FileMetaDataContent, ImageContent, LinkPreviewContent, LocationContent, MentionContent } from '@wireapp/core/lib/conversation/content/';
import { ICalling } from '@wireapp/protocol-messaging';
export declare abstract class MessageHandler {
    account: Account | undefined;
    abstract handleEvent(payload: PayloadBundle | ConversationEvent | UserEvent | TeamEvent): void;
    addUser(conversationId: QualifiedId, userId: string): Promise<void>;
    getConversation(conversationId: QualifiedId): Promise<Conversation>;
    getConversations(conversationIds?: QualifiedId[]): Promise<RemoteConversations>;
    getUser(userId: string): Promise<User>;
    getUsers(userIds: QualifiedId[]): Promise<never[] | {
        found: User[];
        failed?: QualifiedId[];
        not_found?: QualifiedId[];
    }>;
    removeUser(conversationId: QualifiedId, userId: QualifiedId): Promise<void>;
    setAdminRole(conversationId: QualifiedId, userId: QualifiedId): Promise<void>;
    setMemberRole(conversationId: QualifiedId, userId: QualifiedId): Promise<void>;
    sendButtonActionConfirmation(conversationId: string, userId: QualifiedId, referenceMessageId: string, buttonId: string): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendCall(conversationId: string, content: ICalling, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendPoll(conversationId: string, text: string, userIds?: QualifiedId[]): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendConfirmation(conversationId: string, firstMessageId: string, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    sendConnectionRequest(userId: string): Promise<void>;
    sendConnectionResponse(userId: QualifiedId, accept: boolean): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendEditedText(conversationId: string, originalMessageId: string, newMessageText: string, newMentions?: MentionContent[], newLinkPreview?: LinkPreviewContent, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    sendFileByPath(conversationId: string, filePath: string, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendFile(conversationId: string, file: FileContent, metadata: FileMetaDataContent, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendImage(conversationId: string, image: ImageContent, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendLocation(conversationId: string, location: LocationContent, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendPing(conversationId: string, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendReaction(conversationId: string, originalMessageId: string, type: ReactionType, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    sendQuote(conversationId: string, text: string, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendReply(conversationId: string, text: string, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    /**
     * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
     */
    sendText(conversationId: string, text: string, mentions?: MentionContent[], linkPreview?: LinkPreviewContent, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void>;
    sendTyping(conversationId: QualifiedId, status: CONVERSATION_TYPING): Promise<void>;
}
//# sourceMappingURL=MessageHandler.d.ts.map