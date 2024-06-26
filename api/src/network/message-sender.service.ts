import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from '../api-config';
import {
  CreateFundingSubmissionDto,
  Message,
  MessageType,
  NodeBase,
  NodeRecord,
  SyncDataMessage,
  SyncRequestMessage,
  VerificationMessageDto
} from '@bcr/types';
import { DbService } from '../db/db.service';
import { MessageTransportService } from './message-transport.service';
import { SignatureService } from '../authentication/signature.service';
import { NodeService } from '../node';
import { SubmissionConfirmationMessage } from '../types/submission-confirmation.types';
import { recordToBase } from '../utils/data/record-to-dto';

@Injectable()
export class MessageSenderService {
  private logger= new Logger(MessageSenderService.name);

  constructor(
    public apiConfigService: ApiConfigService,
    private messageTransport: MessageTransportService,
    private dbService: DbService,
    private messageAuthService: SignatureService,
    private nodeService: NodeService
  ) {
  }

  private async sendSignedMessage(destination: string, message: Message) {
    try {
      this.logger.log(`send ${message.type} to ${destination}`)
      await this.messageTransport.sendMessage(destination, this.messageAuthService.sign(message));
      await this.nodeService.updateStatus(false, destination);
    } catch (err) {
      this.logger.error('failed to send message', {message, err});
      await this.nodeService.updateStatus(true, destination);
    }
  }

  async sendDirectMessage(
    destinationAddress: string,
    type: MessageType,
    data?: string
  ) {
    const message = Message.createMessage(type, this.apiConfigService.nodeName, this.apiConfigService.nodeAddress, data);
    await this.sendSignedMessage(destinationAddress, message);
  }

  async sendSyncRequestMessage(destinationAddress: string, syncRequest: SyncRequestMessage) {
    await this.sendDirectMessage(destinationAddress, MessageType.syncRequest, JSON.stringify(syncRequest));
  }

  async sendSyncDataMessage(destinationAddress: string, syncData: SyncDataMessage) {
    await this.sendDirectMessage(destinationAddress, MessageType.syncData, JSON.stringify(syncData));
  }

  async broadcastCreateAddressSubmission(
    createSubmission: CreateFundingSubmissionDto,
    excludeAddresses?: string[]
  ) {
    await this.sendBroadcastMessage(MessageType.createSubmission, JSON.stringify(createSubmission), excludeAddresses, true);
  }

  async sendCreateSubmission(destination: string, createSubmission: CreateFundingSubmissionDto) {
    await this.sendDirectMessage(destination, MessageType.createSubmission, JSON.stringify(createSubmission));
  }

  async sendVerification(destination: string, verificationMessageDto: VerificationMessageDto) {
    await this.sendDirectMessage(destination, MessageType.verify, JSON.stringify(verificationMessageDto));
  }

  async broadcastVerification(messageDto: VerificationMessageDto) {
    await this.sendBroadcastMessage(MessageType.verify, JSON.stringify(messageDto));
  }

  async broadcastPing(syncRequest: SyncRequestMessage, synchronised = false) {
    await this.sendBroadcastMessage(MessageType.ping, JSON.stringify(syncRequest), [], synchronised);
  }

  async broadcastRemoveNode(nodeAddress: string) {
    await this.sendBroadcastMessage(MessageType.removeNode, nodeAddress);
  }

  async broadcastCancelSubmission(submissionId: string) {
    await this.sendBroadcastMessage(MessageType.submissionCancellation, submissionId);
  }

  async broadcastSubmissionConfirmation(confirmation: SubmissionConfirmationMessage) {
    await this.sendBroadcastMessage(MessageType.confirmSubmissions, JSON.stringify(confirmation));
  }

  async broadcastNodeList() {
    const localNodeList = await this.nodeService.getNodeDtos();
    await this.sendBroadcastMessage(MessageType.nodeList, JSON.stringify(localNodeList));
  }

  private async sendBroadcastMessage(
    type: MessageType,
    data: string | null,
    excludedAddresses: string[] = [],
    synchronised = false
  ): Promise<Message> {
    const message = Message.createMessage(type, this.apiConfigService.nodeName, this.apiConfigService.nodeAddress, data);
    this.logger.debug('Broadcast Message', message);

    const nodes = await this.dbService.nodes.find({
      blackBalled: false,
      // unresponsive: false
    });
    if (nodes.length < 2) {
      this.logger.debug('No nodes in the network, cannot broadcast message');
      return;
    }

    const messagePromises = nodes
      .filter(node => !excludedAddresses.includes(node.address))
      .filter(node => !message.recipientAddresses.includes(node.address))
      .filter(node => node.address !== message.senderAddress)
      .map(node => this.sendSignedMessage(node.address, message));

    if (this.apiConfigService.syncMessageSending || synchronised) {
      await Promise.all(messagePromises);
      this.logger.debug('broadcast message complete (sync)');
    } else {
      Promise.all(messagePromises).then(() => {
        this.logger.debug('broadcast message complete');
      });
    }
    return message;
  }

  private async sendNodeListToNewJoiner(toNodeAddress: string) {
    const nodeList: NodeBase[] = (await this.dbService.nodes.find({
      address: {$ne: toNodeAddress}
    })).map(recordToBase<NodeBase, NodeRecord>);

    try {
      await this.sendDirectMessage(toNodeAddress, MessageType.nodeList, JSON.stringify(nodeList));
    } catch (err) {
      throw new BadRequestException(toNodeAddress + ' sends error:' + err.message);
    }
  }

  public async broadcastNodeJoin(newNode: NodeBase) {
    const existingPeer = await this.dbService.nodes.findOne({address: newNode.address});
    if (existingPeer) {
      return;
    }
    await this.nodeService.addNode({...newNode, unresponsive: false});
    await this.sendNodeListToNewJoiner(newNode.address);
    await this.sendBroadcastMessage(
      MessageType.nodeJoined,
      JSON.stringify(newNode),
      [newNode.address]
    );
  }


}
