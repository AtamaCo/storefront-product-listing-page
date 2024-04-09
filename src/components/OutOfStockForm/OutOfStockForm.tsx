/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { FunctionComponent } from 'preact';
import { ReactNode } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';

import './OutOfStockForm.css';

import { useStore } from '../../context';
import XIcon from '../../icons/x.svg';


export interface OutOfStockFormProps {
  isOpen: boolean;
  productId: number;
  onClose?: () => void;
  onSuccess?: () => void;
  children: ReactNode;
}

interface OutOfStockFormData {
  email: string;
  productId: string;
}


export const OutOfStockForm: FunctionComponent<OutOfStockFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  children
}: OutOfStockFormProps) => {  

  const {
    config: {  },
  } = useStore();


  const [isModalOpen, setModalOpen] = useState(isOpen);
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
    setModalOpen(false);
  };

  const handleSubmitForm = () => {
    const data: OutOfStockFormData = {
      email: 'asfdas@asdfasd.com',
      productId: "123",
    }

    // eslint-disable-next-line no-console
    console.log(data);
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


  return (
       <>       
    <dialog ref={modalRef} className="ndg-modal-form">
      <button onClick={handleCloseModal} class="dialog-close"><XIcon /></button>

      {children}

      <h3>Me prévenir</h3>
      <p>Saisissez votre e-mail et nous vous enverrons une notification lorsque l’article sera à nouveau disponible</p>
      <form>        
        <fieldset>
          <label for="email">
            E-mail
          </label>
          <input type="email" name="forgot-email" />        
        </fieldset>
        <fieldset class="select">          
          <input type="checkbox" />
          <label for="agree">J’accepte que mes données personnelles soient sauvegardées.</label>
        </fieldset>
        <button onClick={handleSubmitForm}>
        TERMINÉ
        </button>
      </form>
    </dialog>
    </>
  );
};
