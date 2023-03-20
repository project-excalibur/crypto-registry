import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ApiConfigService } from '../api-config';
import {
  CreateSubmissionDto,
  Message,
  MessageType,
  Node,
  VerificationMessageDto,
  VerificationConfirmationDto
} from '@bcr/types';
import { DbService } from '../db/db.service';
import { EventGateway } from './event.gateway';
import { MessageTransportService } from './message-transport.service';
import { SignatureService } from '../authentication/signature.service';
import { NodeService } from './node.service';
import { SubmissionConfirmationMessage } from '../types/submission-confirmation.types';

@Injectable()
export class MessageSenderService implements OnModuleInit {

  constructor(
    public apiConfigService: ApiConfigService,
    private messageTransport: MessageTransportService,
    private logger: Logger,
    private dbService: DbService,
    private eventGateway: EventGateway,
    private messageAuthService: SignatureService,
    private nodeService: NodeService
  ) {
  }

  private async sendSignedMessage(destination: string, message: Message) {
    try {
      await this.messageTransport.sendMessage(destination, this.messageAuthService.sign(message));
      await this.dbService.nodes.findOneAndUpdate({
        address: destination
      }, {
        lastSeen: new Date(),
        unresponsive: false
      });
      this.eventGateway.emitNodes(await this.nodeService.getNodeDtos());
    } catch (err) {
      this.logger.error(err.message, message);
      const node = await this.dbService.nodes.findOne({ address: destination });
      if (node) {
        await this.dbService.nodes.update(node._id, {
          unresponsive: true
        });
        this.eventGateway.emitNodes(await this.nodeService.getNodeDtos());
      }
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

  async broadcastConfirmation(confirmation: VerificationConfirmationDto) {
    await this.sendBroadcastMessage(MessageType.confirmVerification, JSON.stringify(confirmation));
  }

  async broadcastSubmission(createSubmission: CreateSubmissionDto) {
    await this.sendBroadcastMessage(MessageType.submission, JSON.stringify(createSubmission));
  }

  async broadcastVerification(verificationMessageDto: VerificationMessageDto) {
    await this.sendBroadcastMessage(MessageType.verify, JSON.stringify(verificationMessageDto));
  }

  async broadcastPing() {
    await this.sendBroadcastMessage(MessageType.ping, null)
  }

  async broadcastRemoveNode(nodeAddress: string) {
    await this.sendBroadcastMessage(MessageType.removeNode, nodeAddress)
  }

  async broadcastCancelSubmission(paymentAddress: string) {
    await this.sendBroadcastMessage(MessageType.submissionCancellation, paymentAddress)
  }

  async broadcastSubmissionConfirmation(confirmation: SubmissionConfirmationMessage) {
    await this.sendBroadcastMessage(MessageType.confirmSubmissions, JSON.stringify(confirmation))
  }

  // @Cron('5 * * * * *')
  async broadcastNodeList() {
    const localNodeList = await this.nodeService.getNodeDtos();
    await this.sendBroadcastMessage(MessageType.discover, JSON.stringify(localNodeList));
  }

  public async sendBroadcastMessage(
    type: MessageType,
    data: string | null,
    excludedAddresses: string[] = []
  ): Promise<Message> {
    const message = Message.createMessage(type, this.apiConfigService.nodeName, this.apiConfigService.nodeAddress, data);
    this.logger.debug('Broadcast Message', message);

    const nodes = await this.dbService.nodes.find({
      blackBalled: false
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

    if ( this.apiConfigService.syncMessageSending ) {
      await Promise.all(messagePromises);
      this.logger.log('Broadcast Message Complete (sync)');
    } else  {
      Promise.all(messagePromises).then(() => {
        this.logger.log('Broadcast Message Complete');
      });
    }
    return message;
  }

  public async sendNodeListToNewJoiner(toNodeAddress: string) {
    const nodeList: Node[] = (await this.dbService.nodes.find({
      address: { $ne: toNodeAddress },
    })).map(node => ({
      nodeName: node.nodeName,
      address: node.address,
      unresponsive: node.unresponsive,
      blackBalled: node.blackBalled,
      publicKey: node.publicKey,
      ownerEmail: node.ownerEmail,
      lastSeen: node.lastSeen
    }));

    try {
      await this.sendDirectMessage(toNodeAddress, MessageType.nodeList, JSON.stringify(nodeList));
    } catch (err) {
      throw new BadRequestException(toNodeAddress + ' sends error:' + err.message);
    }
  }

  public async processApprovedNode(newNode: Node) {
    const existingPeer = await this.dbService.nodes.findOne({ address: newNode.address });
    if (existingPeer) {
      return;
    }
    await this.nodeService.addNode({ ...newNode, unresponsive: false });
    await this.sendNodeListToNewJoiner(newNode.address);
    await this.sendBroadcastMessage(
      MessageType.nodeJoined,
      JSON.stringify(newNode),
      [newNode.address]
    );
  }

  async onModuleInit() {
    this.logger.log('Message Sender Service - On Module Init');
    const nodeCount = await this.dbService.nodes.count({
      address: this.apiConfigService.nodeAddress
    });
    if (nodeCount === 0) {
      this.logger.log('Insert local node');
      await this.dbService.nodes.insert({
        address: this.apiConfigService.nodeAddress,
        nodeName: this.apiConfigService.nodeName,
        unresponsive: false,
        blackBalled: false,
        publicKey: this.messageAuthService.publicKey,
        ownerEmail: this.apiConfigService.ownerEmail,
        lastSeen: new Date()
      });
      this.eventGateway.emitNodes(await this.nodeService.getNodeDtos());
    }
  }
}
