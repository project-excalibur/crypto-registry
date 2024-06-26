import { useForm } from 'react-hook-form';
import Form from 'react-bootstrap/Form';
import ButtonPanel from '../utils/button-panel';
import BigButton from '../utils/big-button.tsx';
import { useState } from 'react';
import LegacyErrorMessage from '../utils/errorMessage.ts';
import { TestService } from '../../open-api';
import { validateEmail } from '../../utils';
import { ErrorMessage } from '@hookform/error-message';
import { Button, FloatingLabel } from 'react-bootstrap';
import { getErrorMessage } from '../../utils';

interface FormData {
  email: string;
}

const EmailTester = () => {
  const {register, handleSubmit, formState: {isValid, errors}} = useForm<FormData>({
    mode: 'onBlur'
  });
  const [error, setError] = useState<string>('');
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const submit = async (data: FormData) => {
    setError('');
    setIsWorking(true);
    try {
      await TestService.sendTestVerificationEmail({email: data.email});
      setIsChecked(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setIsWorking(false);
  };

  const sendAnother = () => {
    setIsChecked(false);
  };

  return (
    <>
      <h1>Email Tester</h1>
      <p>Use this utility to ensure emails are being sent.</p>
      <Form onSubmit={handleSubmit(submit)}>

        <div style={{marginBottom: 20}}>
          <FloatingLabel
            label="Email">
            <Form.Control
              style={{maxWidth: '1000px'}}
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

        {isChecked ? <p>Test Email Sent. Please check your email.</p> : null}

        <LegacyErrorMessage>{error}</LegacyErrorMessage>
        <ButtonPanel>
          {!isChecked ?
            <BigButton
              disabled={!isValid}
              loading={isWorking}
              htmlType="submit">
              {isWorking ? 'Sending...' : 'Send'}
            </BigButton> :
            null
          }
          {isChecked ?
            <Button onClick={sendAnother}>
              Send Another
            </Button> : null
          }
        </ButtonPanel>
      </Form>
    </>
  );

};

export default EmailTester;
