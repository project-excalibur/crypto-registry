import { useForm } from 'react-hook-form';
import Form from 'react-bootstrap/Form';
import ButtonPanel from '../button-panel';
import BigButton from '../big-button';
import React, { useState } from 'react';
import Error from '../error';
import { TestService } from '../../open-api';
import { validateEmail } from '../../utils/is-valid-email';
import { ErrorMessage } from '@hookform/error-message';
import { FloatingLabel } from 'react-bootstrap';
import { getApiErrorMessage } from '../../utils/get-api-error-message';

interface FormData {
  email: string;
}

export const SendTestEmail = () => {
  const {register, handleSubmit, formState: {isValid, errors}} = useForm<FormData>({
    mode: 'onBlur'
  });
  const [error, setError] = useState<string>('');
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [showCheckEmail, setShowCheckEmail] = useState<boolean>(false);

  const submit = async (data: FormData) => {
    setError('');
    setIsWorking(true);
    try {
      await TestService.sendTestVerificationEmail({email: data.email});
      setShowCheckEmail(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
    setIsWorking(false);
  };

  if (showCheckEmail) {
    return (
      <div>
        <p>Please check your email.</p>
      </div>
    );
  }

  return (
    <>
      <h3>Send a test email</h3>
      <Form style={{marginTop: 30}}
            onSubmit={handleSubmit(submit)}>

        <div style={{marginBottom: 20}}>
          <FloatingLabel
            label="Email">
            <Form.Control
              isInvalid={!!errors?.email}
              placeholder="Email"
              {...register('email', {
                required: 'Email is required',
                validate: validateEmail
              })}>
            </Form.Control>
          </FloatingLabel>
          <Form.Text className="text-danger">
            <ErrorMessage errors={errors} name="email"/>
          </Form.Text>
        </div>

        <Error>{error}</Error>
        <ButtonPanel>
          <BigButton
            disabled={isWorking || !isValid}
            type="submit">
            {isWorking ? 'Sending...' : 'Send'}
          </BigButton>
        </ButtonPanel>
      </Form>
    </>
  );

};
