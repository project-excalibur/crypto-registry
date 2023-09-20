import { TestNetwork, TestNode } from "../testing";

describe('sync-service', () => {
  let node1: TestNode;
  let node2: TestNode;
  let network: TestNetwork;

  afterAll(async () => {
    await network.destroy();
  });

  beforeAll(async () => {
    network = await TestNetwork.create(3, {
      useStartMode: true
    });

    node1 = network.getNode(1);
    node2 = network.getNode(2);
  });

  beforeEach(async () => {
    await network.reset();
    await network.setLeader(node1.address);
    await network.createTestSubmission(node1, {
      sendPayment: true,
      additionalSubmissionCycles: 4
    });
  });

  test('startup', async () => {
    const node1nodes = await node1.db.nodes.find({});
    node1nodes.forEach(node => {
      expect(node.unresponsive).toBe(false)
    })

  })

});
