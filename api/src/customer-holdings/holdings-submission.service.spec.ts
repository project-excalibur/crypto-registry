import { ExchangeStatus } from '@bcr/types';
import { TEST_CUSTOMER_EMAIL, TestNode } from '../testing';
import { getHash } from '../utils';
import { v4 as uuid } from 'uuid';

describe('holdings-submission-service', () => {
  let node: TestNode;

  beforeAll(async () => {
    node = await TestNode.createTestNode(1, {
      singleNode: true
    });
  });

  beforeEach(async () => {
    await node.reset();
  });

  afterAll(async () => {
    await node.destroy();
  });

  it('create holdings', async () => {
    const testExchangeId = await node.getTestExchangeId();
    const id = await node.holdingsSubmissionService.createSubmission(
      testExchangeId,
      [{
        hashedEmail: getHash(TEST_CUSTOMER_EMAIL, node.apiConfigService.hashingAlgorithm),
        amount: 10000000
      }, {
        hashedEmail: getHash('customer-2@mail.com', node.apiConfigService.hashingAlgorithm),
        amount: 20000000
      }]
    );

    const submission = await node.db.holdingsSubmissions.get(id);
    expect(submission.totalHoldings).toBe(30000000);

    const exchange = await node.db.exchanges.get(submission.exchangeId);
    expect(exchange.currentHoldings).toBe(30000000);
    expect(exchange.status).toBe(ExchangeStatus.AWAITING_DATA);
  });

  it('create holdings with exchange uid', async () => {
    const testExchangeId = await node.getTestExchangeId();
    const testUuid = uuid();
    await node.holdingsSubmissionService.createSubmission(
      testExchangeId,
      [{
        exchangeUid: testUuid,
        amount: 10000000
      }, {
        exchangeUid: uuid(),
        hashedEmail: getHash('customer-2@mail.com', node.apiConfigService.hashingAlgorithm),
        amount: 20000000
      }]
    );
    const holdings = await node.db.holdings.find({})
    expect(holdings.length).toBe(2);
    const holding = await node.db.holdings.findOne({
      exchangeUid: testUuid
    })
    expect(holding.amount).toBe(10000000)
  });

  it('should manage isCurrent flag', async () => {
    const previousId = await node.createTestHoldingsSubmission();
    let previous = await node.db.holdingsSubmissions.get(previousId);
    expect(previous.isCurrent).toBe(true);

    let previousHolding = await node.db.holdings.findOne({holdingsSubmissionId: previousId});
    expect(previousHolding.isCurrent).toBe(true);

    const currentId = await node.createTestHoldingsSubmission();
    const current = await node.db.holdingsSubmissions.get(currentId);
    expect(current.isCurrent).toBe(true);

    const currentHolding = await node.db.holdings.findOne({holdingsSubmissionId: currentId});
    expect(currentHolding.isCurrent).toBe(true);

    previous = await node.db.holdingsSubmissions.get(previousId);
    expect(previous.isCurrent).toBe(false);

    previousHolding = await node.db.holdings.findOne({holdingsSubmissionId: previousId});
    expect(previousHolding.isCurrent).toBe(false);
  });
});
