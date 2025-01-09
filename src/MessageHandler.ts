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

import { Conversation, ConversationProtocol, QualifiedUserClients, RemoteConversations } from '@wireapp/api-client/lib/conversation';
import { DefaultConversationRoleName } from '@wireapp/api-client/lib/conversation';
import { CONVERSATION_TYPING } from '@wireapp/api-client/lib/conversation/data';
import { ConversationEvent, TeamEvent, UserEvent } from '@wireapp/api-client/lib/event';
import { QualifiedId, User } from '@wireapp/api-client/lib/user/';
import { Account } from '@wireapp/core';
import { MessageBuilder } from '@wireapp/core';
import { PayloadBundle, ReactionType } from '@wireapp/core/lib/conversation/';
import {
  ButtonActionConfirmationContent,
  FileContent,
  FileMetaDataContent,
  ImageContent,
  LinkPreviewContent,
  LocationContent,
  MentionContent,
} from '@wireapp/core/lib/conversation/content/';
import { Asset, Confirmation, ICalling } from '@wireapp/protocol-messaging';
import FileType = require('file-type');

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export abstract class MessageHandler {
  account: Account | undefined = undefined;

  abstract handleEvent(payload: PayloadBundle | ConversationEvent | UserEvent | TeamEvent): void;

  async addUser(conversationId: QualifiedId, userId: string) {
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

  getConversation(conversationId: QualifiedId): Promise<Conversation> {
    return this.account!.service!.conversation.getConversation(conversationId);
  }

  getConversations(conversationIds?: QualifiedId[]): Promise<RemoteConversations> {
    return this.account!.service!.conversation.getConversations(conversationIds);
  }

  async getUser(userId: string): Promise<User> {
    return this.account!.service!.user.getUser(userId);
  }

  async getUsers(userIds: QualifiedId[]): Promise<never[] | {
    found: User[];
    failed?: QualifiedId[];
    not_found?: QualifiedId[];
  }> {
    return this.account!.service!.user.getUsers(userIds);
  }

  async removeUser(conversationId: QualifiedId, userId: QualifiedId): Promise<void> {
    if (this.account?.service) {
      await this.account.service.conversation.removeUserFromConversation(conversationId, userId);
    }
  }

  public async setAdminRole(conversationId: QualifiedId, userId: QualifiedId): Promise<void> {
    return this.account!.service!.conversation.setMemberConversationRole(
      conversationId,
      userId,
      DefaultConversationRoleName.WIRE_ADMIN,
    );
  }

  public async setMemberRole(conversationId: QualifiedId, userId: QualifiedId): Promise<void> {
    return this.account!.service!.conversation.setMemberConversationRole(
      conversationId,
      userId,
      DefaultConversationRoleName.WIRE_MEMBER,
    );
  }

  async sendButtonActionConfirmation(
    conversationId: string,
    userId: QualifiedId,
    referenceMessageId: string,
    buttonId: string,
  ) {
    if (this.account?.service) {
      const buttonActionConfirmationContent: ButtonActionConfirmationContent = {
        buttonId,
        referenceMessageId,
      };

      const buttonActionConfirmationMessage = MessageBuilder.buildButtonActionConfirmationMessage(
        buttonActionConfirmationContent,
      );

      await this.account.service.conversation.send({
        protocol: ConversationProtocol.PROTEUS,
        conversationId: { id: conversationId, domain: '' },
        payload: buttonActionConfirmationMessage,
        userIds: [userId],
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendCall(conversationId: string, content: ICalling, userIds?: QualifiedId[] | QualifiedUserClients): Promise<void> {
    if (this.account?.service) {
      const callPayload = MessageBuilder.buildCallMessage(content);
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: callPayload,
        userIds,
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendPoll(
    conversationId: string,
    text: string,
    userIds?: QualifiedId[],
  ): Promise<void> {
    if (this.account?.service) {
      const message = MessageBuilder.buildCompositeMessage({ items: [{ text: { content: text } }] });
      await this.account.service.conversation.send({
        protocol: ConversationProtocol.PROTEUS,
        conversationId: { id: conversationId, domain: '' },
        payload: message,
        userIds,
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendConfirmation(
    conversationId: string,
    firstMessageId: string,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const confirmationPayload = MessageBuilder.buildConfirmationMessage({
        firstMessageId,
        type: Confirmation.Type.DELIVERED,
      });
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: confirmationPayload,
        userIds,
      });
    }
  }

  async sendConnectionRequest(userId: string): Promise<void> {
    if (this.account?.service) {
      await this.account.service.connection.createConnection({ id: userId, domain: '' });
    }
  }

  async sendConnectionResponse(userId: QualifiedId, accept: boolean): Promise<void> {
    if (this.account?.service) {
      if (accept) {
        await this.account.service.connection.acceptConnection(userId);
      } else {
        await this.account.service.connection.ignoreConnection(userId);
      }
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendEditedText(
    conversationId: string,
    originalMessageId: string,
    newMessageText: string,
    newMentions?: MentionContent[],
    newLinkPreview?: LinkPreviewContent,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const payload = {
        text: newMessageText,
        originalMessageId,
        mentions: newMentions,
      };
      const editedPayload = MessageBuilder.buildEditedTextMessage(payload);

      const editedMessage = await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: editedPayload,
        userIds,
      });

      if (newLinkPreview) {
        const editedWithPreviewPayload = MessageBuilder.buildEditedTextMessage(
          {
            ...payload,
            linkPreviews: [await this.account.service.linkPreview.uploadLinkPreviewImage(newLinkPreview)],
          },
          editedMessage.id,
        );

        await this.account.service.conversation.send({
          conversationId: { id: conversationId, domain: '' },
          protocol: ConversationProtocol.PROTEUS,
          payload: editedWithPreviewPayload,
          userIds,
        });
      }
    }
  }

  async sendFileByPath(conversationId: string, filePath: string, userIds?: QualifiedId[] | QualifiedUserClients,): Promise<void> {
    const data = await promisify(fs.readFile)(filePath);
    const fileType = await FileType.fromBuffer(data);
    const metadata: FileMetaDataContent = {
      length: data.length,
      name: path.basename(filePath),
      type: fileType ? fileType.mime : 'text/plain',
    };
    return this.sendFile(
      conversationId,
      {
        data,
      },
      metadata,
      userIds,
    );
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendFile(
    conversationId: string,
    file: FileContent,
    metadata: FileMetaDataContent,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const metadataPayload = MessageBuilder.buildFileMetaDataMessage({
        metaData: metadata,
      });
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: metadataPayload,
        userIds,
      });

      try {
        const filePayload = MessageBuilder.buildFileDataMessage(
          {
            file,
            asset: await (await this.account.service!.asset.uploadAsset(file.data)).response,
            metaData: metadata
          },
          metadataPayload.messageId,
        );
        await this.account.service.conversation.send({
          conversationId: { id: conversationId, domain: '' },
          protocol: ConversationProtocol.PROTEUS,
          payload: filePayload,
          userIds,
        });
      } catch (error) {
        const abortPayload = MessageBuilder.buildFileAbortMessage(
          {
            reason: Asset.NotUploaded.FAILED,
          },
          metadataPayload.messageId,
        );
        await this.account.service.conversation.send({
          conversationId: { id: conversationId, domain: '' },
          protocol: ConversationProtocol.PROTEUS,
          payload: abortPayload,
          userIds,
        });
      }
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendImage(conversationId: string, image: ImageContent, userIds?: QualifiedId[] | QualifiedUserClients,): Promise<void> {
    if (this.account?.service) {
      const imagePayload = MessageBuilder.buildImageMessage({
        image,
        asset: await (await this.account.service!.asset.uploadAsset(image.data)).response,
      });
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: imagePayload,
        userIds,
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendLocation(
    conversationId: string,
    location: LocationContent,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const locationPayload = MessageBuilder.buildLocationMessage(location);
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: locationPayload,
        userIds,
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendPing(conversationId: string, userIds?: QualifiedId[] | QualifiedUserClients,): Promise<void> {
    if (this.account?.service) {
      const pingPayload = MessageBuilder.buildPingMessage({ hotKnock: false });
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: pingPayload,
        userIds,
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendReaction(
    conversationId: string,
    originalMessageId: string,
    type: ReactionType,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const reactionPayload = MessageBuilder.buildReactionMessage({ originalMessageId, type });
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: reactionPayload,
        userIds,
      });
    }
  }

  async sendQuote(
    conversationId: string,
    text: string,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const replyPayload = MessageBuilder.buildTextMessage({ text });
      await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: replyPayload,
        userIds,
      });
    }
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  sendReply(
    conversationId: string,
    text: string,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    return this.sendQuote(conversationId, text, userIds);
  }

  /**
   * @param userIds Only send message to specified user IDs or to certain clients of specified user IDs
   */
  async sendText(
    conversationId: string,
    text: string,
    mentions?: MentionContent[],
    linkPreview?: LinkPreviewContent,
    userIds?: QualifiedId[] | QualifiedUserClients,
  ): Promise<void> {
    if (this.account?.service) {
      const payload = MessageBuilder.buildTextMessage({ text, mentions });
      const sentMessage = await this.account.service.conversation.send({
        conversationId: { id: conversationId, domain: '' },
        protocol: ConversationProtocol.PROTEUS,
        payload: payload,
        userIds,
      });

      if (linkPreview) {
        const editedWithPreviewPayload = MessageBuilder.buildTextMessage(
          {
            text,
            linkPreviews: [await this.account.service!.linkPreview.uploadLinkPreviewImage(linkPreview)],
            mentions,
          },
          sentMessage.id,
        );

        await this.account.service.conversation.send({
          conversationId: { id: conversationId, domain: '' },
          protocol: ConversationProtocol.PROTEUS,
          payload: editedWithPreviewPayload,
          userIds,
        });
      }
    }
  }

  async sendTyping(conversationId: QualifiedId, status: CONVERSATION_TYPING): Promise<void> {
    if (this.account?.service) {
      if (status === CONVERSATION_TYPING.STARTED) {
        await this.account.service.conversation.sendTypingStart(conversationId);
      } else {
        await this.account.service.conversation.sendTypingStop(conversationId);
      }
    }
  }
}
