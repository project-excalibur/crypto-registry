import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { HoldingsSubmissionDto, HoldingsSubmissionService, Network } from '../open-api';

import { request } from '../open-api/core/request';
import { OpenAPI } from '../open-api/core';
import { HoldingsStore } from './holdings-store';
import { getErrorMessage } from '../utils';
import { downloadFileFromApi } from '../open-api/core/download-file-from-api.ts';


const creator: StateCreator<HoldingsStore> = (set) => ({
  errorMessage: null,
  isWorking: true,
  currentHoldings: null,
  editMode: false,

  startEdit: () => {
    set({editMode: true});
  },

  clearEdit: () => {
    set({editMode: false});
  },

  createHoldingsSubmission: async (
    holdingsFiles: File,
    network: Network
  ) => {
    set({errorMessage: null, isWorking: true});
    try {
      const formData = new FormData();
      formData.append('holdingsFile', holdingsFiles);
      formData.append('network', network);
      const result: HoldingsSubmissionDto = await request(OpenAPI, {
        method: 'POST',
        url: '/api/holdings-submission/submit-csv',
        formData: formData
      });
      set({
        isWorking: false,
        editMode: false,
        currentHoldings: result
      });
      return result;
    } catch (err) {
      set({
        errorMessage: getErrorMessage(err),
        isWorking: false
      });
      return null;
    }
  },

  getHoldingsSubmissions: async (): Promise<HoldingsSubmissionDto[]> => {
    return HoldingsSubmissionService.getSubmissions();
  },

  loadCurrentHoldings: async (): Promise<void> => {
    try {
      set({
        errorMessage: null,
        isWorking: true
      });
      const holdings = await HoldingsSubmissionService.getCurrentSubmission();
      set({
        errorMessage: null,
        currentHoldings: holdings,
        isWorking: false
      });
    } catch (err) {
      set({
        errorMessage: getErrorMessage(err),
        isWorking: false,
        currentHoldings: null
      });
    }
  },

  downloadExampleFile: async () => {
    try {
      await downloadFileFromApi('/api/holdings-submission/download-example-file');
    } catch (err) {
      set({errorMessage: getErrorMessage(err)});
    }
  }

});

export const useHoldingsStore = create<HoldingsStore>()(
  persist(creator, {
    name: 'holdings-store'
  })
);
