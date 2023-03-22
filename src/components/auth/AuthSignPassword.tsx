import type { FC } from '../../lib/teact/teact';
import React, { memo, useCallback, useState } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import type { GlobalState } from '../../global/types';

import { pick } from '../../util/iteratees';
import useLang from '../../hooks/useLang';

import MonkeyPassword from '../common/PasswordMonkey';
import PasswordForm from '../common/PasswordForm';
import Button from "../ui/Button";
import {passwordCheck} from "../../worker/share/utils/helpers";

type StateProps = Pick<GlobalState, 'authIsLoading' | 'authError' | 'authHint'>;

const AuthSignPassword: FC<StateProps> = ({
  authIsLoading, authError, authHint,
}) => {
  const { setAuthPassword, clearAuthError,showAuthError } = getActions();

  const lang = useLang();
  const [showPassword, setShowPassword] = useState(false);

  const handleChangePasswordVisibility = useCallback((isVisible) => {
    setShowPassword(isVisible);
  }, []);

  const handleSubmit = useCallback(async (password: string) => {
    if(!passwordCheck(password)){
      return showAuthError(lang("PasswordTipsCheck"))
    }
    setAuthPassword({ password });
  }, [setAuthPassword]);

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
        <h1>{lang('Login.Header.Password')}</h1>
        <p className="note"></p>
        <PasswordForm
          clearError={clearAuthError}
          error={authError && lang(authError)}
          hint={lang("PasswordTipsLoginPlaceholder")}
          isLoading={authIsLoading}
          isPasswordVisible={showPassword}
          onChangePasswordVisibility={handleChangePasswordVisibility}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): StateProps => pick(global, ['authIsLoading', 'authError', 'authHint']),
)(AuthSignPassword));
