import type {FC} from '../../lib/teact/teact';
import React, {memo, useCallback, useEffect, useState,} from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import Modal from './Modal';
import {ShowModalFromEventPayload} from "../../worker/share/utils/modal";
import Button from "./Button";
import TextArea from "./TextArea";
import {ChangeEvent} from "react";

type OwnProps = {};

let onConfirm: Function | null = null

const GlobalModal: FC<OwnProps> = ({}: OwnProps) => {
  const [payload, setPayload] = useState<ShowModalFromEventPayload|undefined>(undefined);
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);

  const handleSubmit = useCallback((password) => {
    if (onConfirm) {
      onConfirm({value});
      setOpen(false)
      setValue("")
    }
  }, [value]);

  useEffect(() => {
    const evt = (e: Event) => {
      if (!open) {
        //@ts-ignore
        const payload = e.detail.payload;
        setPayload(payload)
        //@ts-ignore
        onConfirm = e.detail.callback;
        setOpen(true);
        setValue(payload.initVal|| "")
      }
    }
    document.addEventListener('modal', evt);
    return () => {
      document.removeEventListener('modal', evt);
    }
  }, [open])

  return (
    <Modal
      hasCloseButton
      isOpen={open}
      onClose={() => {
        if (onConfirm) {
          onConfirm({value: ""});
        }
        setValue("")
        setOpen(false)
      }}
      title={payload && payload.title}
      className=""
    >
      {
        payload && payload.type === 'singleInput' &&
        <div className="settings-content password-form custom-scroll background">
          <div className="pt-4 pb-4 mb-2 background">
            <TextArea
              value={value}
              onChange={handleChange}
              label={payload.desc}
              disabled={false}
            />
          </div>
          <Button type="button" onClick={handleSubmit} ripple={true} isLoading={false} disabled={false}>
            下一步
          </Button>
        </div>
      }

    </Modal>
  );
};

export default memo(GlobalModal);
