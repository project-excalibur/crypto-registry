import { useForm } from 'react-hook-form';
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Input from './input';
import ButtonPanel from './button-panel';
import BigButton from './big-button';
import arrayBufferToHex from 'array-buffer-to-hex';
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

  const copy = async () => {
    if (hash) {
      await navigator.clipboard.writeText(hash);
    }
  };

  return (
    <>
      <h1>SHA265</h1>
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

        <div className={styles.hex} onClick={copy}>{hash}</div>

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

