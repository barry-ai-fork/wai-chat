import type { FC } from '../../lib/teact/teact';
import React, {memo, useCallback, useState} from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import type { GlobalState } from '../../global/types';

import { pick } from '../../util/iteratees';
import useLang from '../../hooks/useLang';

import MonkeyPassword from '../common/PasswordMonkey';
import PasswordForm from '../common/PasswordForm';
import Button from "../ui/Button";
import {passwordCheck} from "../../worker/share/utils/helpers";
import TextArea from "../ui/TextArea";
import Mnemonic from "../../lib/ptp/wallet/Mnemonic";

type StateProps = Pick<GlobalState, 'authIsLoading' | 'authError' | 'authHint'>;

const AuthSignPassword: FC<StateProps> = ({
  authIsLoading, authError, authHint,
}) => {
  const { setAuthPassword, clearAuthError,showAuthError } = getActions();

  const lang = useLang();
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicError, setMnemonicError] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);

  const getMaxLengthIndicator = ()=>{
    const t = mnemonic.trim().split(" ")
    return (mnemonic.trim().length === 0 ? 0 : t.length).toString()
  }

  const handleShowMnemonic = useCallback(() => {
    setShowMnemonic(!showMnemonic);
    setMnemonic("")
  }, [showMnemonic,setShowMnemonic]);

  const handleGenMnemonic = useCallback(() => {
    const mnemonicObj = new Mnemonic();
    setMnemonic(mnemonicObj.getWords());
  }, [setMnemonic]);

  const onChangeMnemonic = useCallback((e) => {
    setMnemonicError("")
    setMnemonic(e.target.value);
  }, []);

  const handleChangePasswordVisibility = useCallback((isVisible) => {
    setShowPassword(isVisible);
  }, []);

  const handleSubmit = useCallback(async (password: string) => {
    if(!passwordCheck(password)){
      return showAuthError(lang("PasswordTipsCheck"))
    }
    let mnemonic_ = mnemonic.trim();
    if(showMnemonic){
      if(getMaxLengthIndicator() !== "12"){
        return setMnemonicError("助记词需12个单词")
      }

      const m = new Mnemonic(mnemonic_);
      if(!m.checkMnemonic()){
        return setMnemonicError("助记词不合法，请输入12个单词,用空格分割")
      }
    }

    setAuthPassword({ password,mnemonic:mnemonic_});
  }, [setAuthPassword,mnemonic]);

  const handleClose = useCallback(() => {
    getActions().updateGlobal({
      authState:"authorizationStateReady"
    })
  }, [setAuthPassword]);

  return (
    <div id="auth-password-form" className="custom-scroll">
      <div className={'auth-close'}>
        <Button
          round
          color="translucent"
          size="smaller"
          ariaLabel={lang('Close')}
          onClick={handleClose}
        >
          <i className="icon-close" />
        </Button>
      </div>
      <div className="auth-form">
        <MonkeyPassword isPasswordVisible={showPassword} />
        <h1>{showMnemonic ? `助记词导入` : lang('Login.Header.Password')}</h1>
        <p className="note"></p>

        {
          showMnemonic &&  <TextArea
            noReplaceNewlines={true}
            error={mnemonicError || ""}
            inputMode={'text'}
            value={mnemonic}
            onChange={onChangeMnemonic}
            label={"助记词"}
            disabled={authIsLoading}
            maxLength={1000}
            maxLengthIndicator={getMaxLengthIndicator()}
          />
        }

        <PasswordForm
          clearError={clearAuthError}
          error={authError && lang(authError)}
          hint={lang("PasswordTipsLoginPlaceholder")}
          isLoading={authIsLoading}
          isPasswordVisible={showPassword}
          onChangePasswordVisibility={handleChangePasswordVisibility}
          onSubmit={handleSubmit}
        />

        <div className={"auth-or-line"}>
          <div className={"auth-line"}></div>
          <div className={"auth-or"}>OR</div>
        </div>
        {
          showMnemonic &&
          <Button isText onClick={handleGenMnemonic}>助记词生成</Button>
        }
        <Button isText onClick={handleShowMnemonic}>{showMnemonic ? "密码登录" : "助记词登录"}</Button>

      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): StateProps => pick(global, ['authIsLoading', 'authError', 'authHint']),
)(AuthSignPassword));
