import { MessageSenderService } from './message-sender.service';
import { Message } from '@bcr/types';
import { P2pService } from './p2p.service';

export class MockMessageSenderService implements MessageSenderService {

  private nodes = new Map<string, P2pService>();

  async sendMessage(destination: string, message: Message): Promise<void> {
    const destinationNode = this.nodes.get(destination);
    await destinationNode.receiveMessage(message);
  }

  addNode(node: P2pService) {
    this.nodes.set(node.apiConfigService.p2pLocalAddress, node);
  }

}
