/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SendTestEmailDto } from '../models/SendTestEmailDto';
import type { ServiceTestRequestDto } from '../models/ServiceTestRequestDto';
import type { ServiceTestResultDto } from '../models/ServiceTestResultDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class TestService {

    /**
     * @param requestBody 
     * @returns ServiceTestResultDto 
     * @throws ApiError
     */
    public static testBitcoinService(
requestBody: ServiceTestRequestDto,
): CancelablePromise<ServiceTestResultDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/test/service-test',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns any 
     * @throws ApiError
     */
    public static sendTestVerificationEmail(
requestBody: SendTestEmailDto,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/test/send-test-verification-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @returns any 
     * @throws ApiError
     */
    public static getGuardedRoute(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test/guarded-route',
        });
    }

    /**
     * @returns any 
     * @throws ApiError
     */
    public static logError(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test/log-error',
        });
    }

}
