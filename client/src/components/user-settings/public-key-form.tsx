import { Form } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { useCallback, useEffect, useState } from 'react';
import { UserSettingsService } from '../../open-api';
import { getErrorMessage } from '../../utils';
import ErrorMessage from '../utils/error-message.tsx';
import BigButton from '../utils/big-button.tsx';

type UserSettingsFormType = {
  publicKey?: string;
};

const PublicKeyForm = () => {
  const [form] = Form.useForm();
  const [isWorking, setIsWorking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialValues, setInitialValues] = useState<UserSettingsFormType>();

  const savePublicKey = useCallback(async (values: UserSettingsFormType) => {
    setIsWorking(true);
    setErrorMessage('');
    setTimeout(async () => {
      try {
        if (values.publicKey) {
          await UserSettingsService.savePublicKey({
            publicKey: values.publicKey
          });
          setIsWorking(false);
        }
      } catch (err) {
        setIsWorking(false);
        setErrorMessage(getErrorMessage(err));
      }
    }, 2000);
  }, []);

  useEffect(() => {
    const loadPublicKey = async () => {
      try {
        setIsWorking(true);
        setErrorMessage('');
        setInitialValues(await UserSettingsService.getPublicKey());
        setIsWorking(false);
      } catch (err) {
        setIsWorking(false);
        setErrorMessage(getErrorMessage(err));
      }
    };
    loadPublicKey().then();
  }, []);

  return (
    <>
      <h5>API Authentication</h5>
      <p>Entry must be a valid RSA Key of length 2048. See <a style={{color: 'blue'}}>documentation</a> for API usage.
      </p>

      {initialValues ?
        <Form
          style={{maxWidth: 650}}
          name="basic"
          form={form}
          initialValues={initialValues}
          onFinish={savePublicKey}
          autoComplete="off">

          <Form.Item<UserSettingsFormType>
            label="Public Key"
            name="publicKey"
            rules={[{required: true, message: 'Your public key is required'}]}>
            <TextArea
              disabled={isWorking}
              rows={10}
              placeholder="Cut/Paste your public key here"/>
          </Form.Item>

          <ErrorMessage errorMessage={errorMessage}/>

          <Form.Item style={{marginTop: 20}}>
            <BigButton type="primary"
                       disabled={!isWorking && !form.isFieldsTouched()}
                       loading={isWorking}
                       htmlType="submit">
              Save Settings
            </BigButton>
          </Form.Item>
        </Form> : null}

    </>
  );
};

export default PublicKeyForm;

