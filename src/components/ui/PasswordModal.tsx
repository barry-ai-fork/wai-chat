import type {FC} from '../../lib/teact/teact';
import React, {memo, useCallback, useEffect, useState,} from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import Modal from './Modal';
import PasswordMonkey from "../common/PasswordMonkey";
import PasswordForm from "../common/PasswordForm";
import {passwordCheck} from "../../worker/share/utils/helpers";
import InputText from "./InputText";

type OwnProps = {};

let onConfirm: Function | null = null


const PasswordModal: FC<OwnProps> = ({}: OwnProps) => {

  const [open, setOpen] = useState<boolean>(false);
  const [showHitInput, setShowHitInput] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const [shouldShowPassword, setShouldShowPassword] = useState(false);
  const lang = useLang();

  const handleSubmit = useCallback((password) => {
    if (!passwordCheck(password)) {
      setValidationError(lang("PasswordTipsCheck"))
      return
    }
    if (onConfirm) {
      onConfirm({password, hint});
      setOpen(false)
    }
  }, [hint]);

  useEffect(() => {
    const evt = (e: Event) => {
      if (!open) {
        setOpen(true);
        // @ts-ignore
        onConfirm = e.detail.callback;
        // @ts-ignore
        setHint(e.detail.hint)
        // @ts-ignore
        setShowHitInput(!e.detail.hideHitInput);
      }
    }
    document.addEventListener('password', evt);
    return () => {
      document.removeEventListener('password', evt);
    }
  }, [setHint, setShowHitInput, open])

  const handleClearError = useCallback(() => {
    setValidationError('');
  }, []);

  return (
    <Modal
      hasCloseButton
      isOpen={open}
      onClose={() => {
        if (onConfirm) {
          onConfirm({password: "", hint: ""});
        }
        setOpen(false)
      }}
      title="Password"
      className=""
    >
      <div className="settings-content password-form custom-scroll">
        <div className="settings-content-header no-border">
          <PasswordMonkey isBig isPasswordVisible={shouldShowPassword}/>
        </div>
        <div className="settings-item pt-0">
          {
            showHitInput &&
            <InputText
              id="pwd-hint"
              type={"text"}
              label={lang("PasswordTipsLocalHint")}
              onChange={(e) => {
                setHint(e.target.value)
              }}
              value={hint}
              autoComplete="given-name"
            />
          }
          <PasswordForm
            error={validationError}
            hint={(!showHitInput && hint) ? hint : lang("PasswordTipsLocalPlaceholder")}
            shouldDisablePasswordManager={true}
            submitLabel={lang('Next')}
            clearError={handleClearError}
            isLoading={false}
            isPasswordVisible={shouldShowPassword}
            shouldResetValue={true}
            onChangePasswordVisibility={setShouldShowPassword}
            onSubmit={handleSubmit}
          />
        </div>
        <div className="help_text pt-2 pb-4 pr-2">
          <ul>
            <li>{lang("PasswordTipsLocalStorage")}</li>
            <li>{lang("PasswordTipsLocalStorage1")}</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default memo(PasswordModal);
