import subDays from 'date-fns/subDays';
import { TestNode } from '../network/test-node';
import { getHash } from '../utils';
import { TestNetwork } from '../network/test-network';
import { testCustomerEmail } from '../testing';

describe('verification-service', () => {
  let node1: TestNode;
  let node2: TestNode;
  let network: TestNetwork;
  let submissionId: string;

  describe('multi-node', () => {
    beforeAll(async () => {
      network = await TestNetwork.create(3);
      node1 = network.getNode(1);
      node2 = network.getNode(2);
    });

    beforeEach(async () => {
      await network.reset();
      await network.setLeader(node1.address);
      await network.createTestSubmission(node1)
    });

    afterAll(async () => {
      await node1.destroy();
    });

    async function runMultiNodeVerificationTest(
      leader: TestNode,
    ) {
      const requestedDate = new Date();
      const verificationId = await node1.verificationService.createVerification({
        email: testCustomerEmail,
        receivingAddress: node1.address,
        requestDate: requestedDate
      });

      const receiver = node1;

      // leader should send the email
      expect(leader.sendMailService.noEmailSent).toBe(false);
      expect(leader.sendMailService.getVal('toEmail')).toBe(leader.sendMailService.getLastToEmail());

      // follower should not send the email
      const followers = await network.getFollowers()
      followers.forEach(follower => {
        expect(follower.sendMailService.noEmailSent).toBe(true);
      })

      // Verification Record should be complete on leader
      const leaderVerificationRecord = await leader.db.verifications.get(verificationId);
      expect(leaderVerificationRecord.hashedEmail).toBe(getHash(testCustomerEmail, 'simple'))
      expect(leaderVerificationRecord.leaderAddress).toBe(leader.address);
      expect(leaderVerificationRecord.receivingAddress).toBe(receiver.address);
      expect(leaderVerificationRecord.precedingHash).toBe('genesis');
      expect(leaderVerificationRecord.requestDate.getTime()).toBe(requestedDate.getTime());
      expect(leaderVerificationRecord.index).toBe(1);

      // Verification Record should be complete on follower
      for (const follower of followers) {
        const followerVerificationRecord = await follower.db.verifications.get(verificationId);
        expect(followerVerificationRecord.hashedEmail).toBe(getHash(testCustomerEmail, 'simple'))
        expect(followerVerificationRecord.leaderAddress).toBe(leader.address);
        expect(followerVerificationRecord.receivingAddress).toBe(receiver.address);
        expect(followerVerificationRecord.precedingHash).toBe('genesis');
        expect(followerVerificationRecord.requestDate.getTime()).toBe(requestedDate.getTime());
        expect(followerVerificationRecord.hash).toBe(leaderVerificationRecord.hash);
        expect(followerVerificationRecord._id).toBe(leaderVerificationRecord._id);
        expect(followerVerificationRecord.index).toBe(1);
      }
    }

    it('receiver is leader', async () => {
      await network.setLeader(node1.address);
      await runMultiNodeVerificationTest(node1);
    })

    it('receiver is not leader', async () => {
      await network.setLeader(node2.address);
      await runMultiNodeVerificationTest(node2);
    })

    it('should throw exception if email is not submitted', async () => {
      await expect(node1.verificationService.createVerification({
        email: 'not-submitted@mail.com',
        receivingAddress: node1.address,
        leaderAddress: node1.address,
        requestDate: new Date()
      })).rejects.toThrow();
      expect(node1.sendMailService.noEmailSent).toBe(true);
    });

    it('should not verify if submission is too old', async () => {
      const oldDate = subDays(Date.now(), 8);
      await node1.db.submissions.update(submissionId, {
        createdDate: oldDate
      });

      await expect(node1.verificationService.createVerification({
        email: 'not-submitted@mail.com',
        receivingAddress: node1.address,
        leaderAddress: node1.address,
        requestDate: new Date()
      })).rejects.toThrow();
      expect(node1.sendMailService.noEmailSent).toBe(true);
    });
  })

  describe('single-node', () => {

    beforeAll(async () => {
      network = await TestNetwork.create(1);
      node1 = network.getNode(1);
    });

    beforeEach(async () => {
      await network.reset();
      await network.setLeader(node1.address);
      await network.createTestSubmission(node1)
    });

    afterAll(async () => {
      await node1.destroy();
    });

    it('single node', async () => {
      const verificationId = await node1.verificationService.createVerification({
        email: testCustomerEmail,
        receivingAddress: node1.address,
        leaderAddress: node1.address,
        requestDate: new Date()
      });

      // leader should send the email
      expect(node1.sendMailService.noEmailSent).toBe(false);

      const leaderVerificationRecord = await node1.db.verifications.get(verificationId);
      expect(leaderVerificationRecord.hashedEmail).toBe(getHash(testCustomerEmail, 'simple'))
      expect(leaderVerificationRecord.leaderAddress).toBe(node1.address);
      expect(leaderVerificationRecord.receivingAddress).toBe(node1.address);
      expect(leaderVerificationRecord.precedingHash).toBe('genesis');
      expect(leaderVerificationRecord.index).toBe(1);
    });
  })

});
