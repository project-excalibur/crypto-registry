import { FundingSubmissionDto } from '../open-api';

export type FundingMode = 'showForm' | 'showPending' | 'showCurrent';

export interface FundingStore {
  isProcessing: boolean;
  isWorking: boolean;
  mode: FundingMode;
  errorMessage: string | null;
  clearFundingErrorMessage: () => void
  signingMessage: string | null;
  pendingSubmission: FundingSubmissionDto | null,
  currentSubmission: FundingSubmissionDto | null,

  setMode: (mode: FundingMode) => void,
  cancelPending: () => Promise<void>,
  createFundingSubmission: (
    addressFile: File
  ) => Promise<FundingSubmissionDto | null>;
  loadCurrentSubmission: () => Promise<void>,
  pollPendingSubmission: () => Promise<void>,
  updateSigningMessage: () => Promise<void>,
  getFundingSubmissions: () => Promise<FundingSubmissionDto[]>
  downloadExampleFile: () => Promise<void>
}
