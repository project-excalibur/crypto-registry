import { VerificationDto } from '../../open-api';
import { Table } from 'react-bootstrap';
import DateFormat from '../utils/date-format';
import Enum from '../utils/enum';

export interface VerificationTableProps {
  verifications: VerificationDto[];
}

export const VerificationTable = ({verifications}: VerificationTableProps) => {

  const renderNoData = () => {
    return <tr>
      <td colSpan={4}>No data</td>
    </tr>;
  };

  const renderRow = (verification: VerificationDto, index: number) =>
    <tr key={index}>
      <td><DateFormat dateStr={verification.requestDate}/></td>
      <td><Enum enumValue={verification.status}/></td>
    </tr>;

  const renderTable = () => (
    <>
      <p>Below is a history of verification request made on this email. The request was initiated at the Receiver
        node and processed by the Leader at that point.</p>
      <Table striped bordered hover>
        <thead>
        <tr key="header">
          <th>Requested Date/Time</th>
          <th>Status</th>
        </tr>
        </thead>
        <tbody>
        {verifications && verifications.length > 0 ? verifications.map((v, i) => renderRow(v, i)) : renderNoData()}
        </tbody>
      </Table>
    </>
  );

  return renderTable();
};
