import { TestNode } from "../network/test-node";
import { TestNetwork } from "../network/test-network";

describe.skip('test-utils', () => {
  let node1: TestNode;
  let node2: TestNode;
  let node3: TestNode;
  let network: TestNetwork;

  beforeAll(async () => {
    network = await TestNetwork.create(3);
    node1 = network.getNode(1);
    node2 = network.getNode(2);
    node3 = network.getNode(3);
    await network.setLeader(node1.address)
    await network.createTestSubmission(node1)
  });

  afterEach(async () => {
    await network.reset();
  });

  afterAll(async () => {
    await network.destroy();
  });

  test('reset leader', async () => {
    await node1.testUtilsService.resetNode({
      resetNetwork: true,
      emitResetNetwork: true
    })

    expect(await node1.db.submissions.count({})).toBe(0);
    expect(await node2.db.submissions.count({})).toBe(0);
    expect(await node3.db.submissions.count({})).toBe(0);

  })

});
