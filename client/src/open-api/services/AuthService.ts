/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CredentialsDto } from '../models/CredentialsDto';
import type { RegisterUserDto } from '../models/RegisterUserDto';
import type { ResetPasswordDto } from '../models/ResetPasswordDto';
import type { SendResetPasswordDto } from '../models/SendResetPasswordDto';
import type { SignInDto } from '../models/SignInDto';
import type { VerifyUserDto } from '../models/VerifyUserDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AuthService {

    /**
     * @param requestBody 
     * @returns any 
     * @throws ApiError
     */
    public static registerUser(
requestBody: RegisterUserDto,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns any 
     * @throws ApiError
     */
    public static verifyUser(
requestBody: VerifyUserDto,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verify',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns CredentialsDto 
     * @throws ApiError
     */
    public static resetPassword(
requestBody: ResetPasswordDto,
): CancelablePromise<CredentialsDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns any 
     * @throws ApiError
     */
    public static sendResetPasswordEmail(
requestBody: SendResetPasswordDto,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/send-reset-password-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns CredentialsDto 
     * @throws ApiError
     */
    public static signIn(
requestBody: SignInDto,
): CancelablePromise<CredentialsDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/sign-in',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @returns any 
     * @throws ApiError
     */
    public static signOut(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/sign-out',
        });
    }

    /**
     * @returns any 
     * @throws ApiError
     */
    public static refreshToken(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh-token',
        });
    }

}