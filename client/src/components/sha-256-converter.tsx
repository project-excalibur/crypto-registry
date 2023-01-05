import { useForm } from 'react-hook-form';
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Input from './input';
import ButtonPanel from './button-panel';
import BigButton from './big-button';
import arrayBufferToHex from 'array-buffer-to-hex';
import TextClipboard from './text-clipboard';
import styles from './sha-265-converter.module.css';

interface Inputs {
  email: string;
}

const Sha256Converter = () => {

  const { handleSubmit, register, formState: { isValid, errors } } = useForm<Inputs>({
    mode: 'onBlur'
  });

  const [hash, setHash] = useState<string | null>();

  const calculateHash = async (data: Inputs) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data.email);
    const hash265 = await crypto.subtle.digest('SHA-256', encoded);
    const hashHex = arrayBufferToHex(hash265);
    setHash(hashHex);
  };

  return (
    <>
      <h1>Generate Sha256 Hash</h1>
      <p>Use this tool to generate the SHA256 hash of your email</p>
      <Form onSubmit={handleSubmit(calculateHash)}>
        <Input type="text"
               isInvalid={errors.email}
               placeholder="Email"
               {...register('email', {
                 required: 'Email is required',
                 pattern: {
                   value: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                   message: 'Please enter a valid email'
                 }
               })} />

        {errors.email?.type === 'required' &&
          <Form.Control.Feedback type="invalid">
            Email is required
          </Form.Control.Feedback>
        }

        {errors.email?.type === 'pattern' &&
          <Form.Control.Feedback type="invalid">
            Email is required
          </Form.Control.Feedback>
        }

        {hash ? <div className={styles.hex}><TextClipboard text={hash} /></div> : null}

        <ButtonPanel>
          <BigButton disabled={!isValid}
                     type="submit">
            Hash
          </BigButton>
        </ButtonPanel>
      </Form>
    </>
  );
};

export default Sha256Converter;
