/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { FunctionComponent } from 'preact';
import { ChangeEvent, ReactNode } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { FormEvent } from 'react';
import { getGraphQL } from 'src/api/graphql';

import './OutOfStockForm.css';

import {REGISTER_STOCK_STATUS_UPDATE} from '../../api/queries';
import { useStore } from '../../context';
import XIcon from '../../icons/x.svg';


export interface OutOfStockFormProps {
  isOpen: boolean;
  productId?: number;
  onClose?: () => void;
  onSuccess?: (message: string) => void;
  apiUrl: string;
  children?: ReactNode;
}

interface OutOfStockFormData {
  email: string;  
  agree: boolean;
}

const initialFormState = {  
  agree: false,
  email: '',
}

export const OutOfStockForm: FunctionComponent<OutOfStockFormProps> = ({
  isOpen,
  productId,
  apiUrl,
  onClose,
  onSuccess,
  children
}: OutOfStockFormProps) => {  

  const {
    config: {  },
  } = useStore();

  const [isModalOpen, setModalOpen] = useState(isOpen);
  const [formState, setFormState] = useState<OutOfStockFormData>(initialFormState);

  const modalRef = useRef<HTMLDialogElement | null>(null);

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
    setModalOpen(false);
  };

  const handleSubmitForm = async (event: FormEvent): Promise<void> => {
    
    event.preventDefault();
    event.stopPropagation();

    try {
      const result = await getGraphQL(apiUrl, REGISTER_STOCK_STATUS_UPDATE, {
        ...formState,
        productId,
      });  
      if (onSuccess) {
        onSuccess(result?.data?.AmxnotifStockSubscribe?.response_message);
      }        
    } catch(error) {
      // todo - how do we want to handle failures?
    }

    if (onSuccess) {
      onSuccess();
    }    
  }

  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const modalElement = modalRef.current;

    if (modalElement) {
      if (isModalOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isModalOpen]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {    
    const { name, value, checked } = event.target;
    setFormState((prevFormData) => ({
      ...prevFormData,
      // sorry for this, it's a lazy way of getting a boolean from the checkec event 
      [name]: name !== 'agree' ? value : checked,
    }));
  };



  return (
       <>       
    <dialog ref={modalRef} className="ndg-modal-form">
      <button onClick={handleCloseModal} class="dialog-close"><XIcon /></button>

      {children}

      <h3>Me prévenir</h3>
      <p>Saisissez votre e-mail et nous vous enverrons une notification lorsque l’article sera à nouveau disponible</p>
      <form onSubmit={handleSubmitForm}>        
        <fieldset>
          <label for="email">
            E-mail
          </label>
          <input type="email" onChange={handleInputChange} name="email" />        
        </fieldset>
        <fieldset class="select">          
          <input type="checkbox" name="agree" onChange={handleInputChange} />
          <label for="agree">J’accepte que mes données personnelles soient sauvegardées.</label>
        </fieldset>
        <button>
        TERMINÉ
        </button>
      </form>
    </dialog>
    </>
  );
};
