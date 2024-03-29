import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatabaseRecord } from './db.types';
import { IsNotEmpty, IsString } from 'class-validator';
import { SyncRequestMessage } from './synchronisation.types';

export class NodeBase extends SyncRequestMessage {
  @ApiProperty()
  nodeName: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  unresponsive: boolean;

  @ApiProperty()
  blackBalled: boolean;

  @ApiProperty()
  publicKey: string;

  @ApiProperty()
  ownerEmail: string;

  @ApiProperty({type: Date})
  lastSeen: Date;

  @ApiProperty()
  leaderVote: string;

  @ApiProperty()
  isLeader: boolean

  @ApiPropertyOptional()
  synchronisingSourceNode?: string | null
}

export class NodeRecord extends NodeBase implements DatabaseRecord {
  _id: string;
  createdDate: Date;
  updatedDate: Date;
}

export class NodeDto extends NodeRecord {
  @ApiProperty()
  isLocal: boolean;
}

export class NodeAddress {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nodeAddress: string;
}
