import type {ChangeEvent} from 'react';
import {MouseEvent as ReactMouseEvent} from "react";
import type {FC} from '../../lib/teact/teact';
import React, {memo, useCallback, useEffect, useState} from '../../lib/teact/teact';
import {getActions, withGlobal} from '../../global';
import github from '../../assets/oauth/github.svg';
import google from '../../assets/oauth/google.svg';
import PasswordValidator from "password-validator";
import type {GlobalState} from '../../global/types';

import {pick} from '../../util/iteratees';
import useLang from '../../hooks/useLang';

import Button from '../ui/Button';
import InputText from '../ui/InputText';
import PasswordForm from "../common/PasswordForm";
import {sha1} from '../../lib/gramjs/Helpers';
import {parseQueryFromUrl} from "../../worker/helpers/network";
import {BASE_API, SESSION_TOKEN, TEST_PWD, TEST_USERNAME} from "../../config";
import {isEmailValid} from "../../worker/helpers/helpers";
import MsgConn, {MsgClientState} from "../../lib/client/msgConn";

type StateProps = Pick<GlobalState, 'authError'>;
let handleTokenGoing = false;
const AuthRegisterEmail: FC<StateProps> = ({
  authError,
}) => {

  const { clearAuthError, showAuthError,updateGlobal } = getActions();

  const lang = useLang();
  const [isOAuthLoginOk, setIsOAuthLoginOk] = useState(false);
  const [isRegMode, setIsRegMode] = useState(false);
  const [email, setEmail] = useState(TEST_USERNAME);
  const [isButtonShown, setIsButtonShown] = useState(isEmailValid(email));
  const [password, setPassword] = useState(TEST_PWD);
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordRepeatError, setPasswordRepeatError] = useState('');
  const [authIsLoading,setAuthIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

  const toggleRegMode = useCallback((event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    setIsRegMode(!isRegMode);
  }, [isRegMode]);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (authError) {
      clearAuthError();
    }
    const { target } = event;
    setEmail(target.value);
    setIsButtonShown(isEmailValid(target.value));
  }, [authError, clearAuthError]);

  const handlePasswordChange = useCallback((password:string) => {
    if (passwordError) {
      setPasswordError("");
    }
    if (authError) {
      clearAuthError();
    }

    setPassword(password);
  }, [passwordError, setPasswordError,clearAuthError]);

  const handlePasswordRepeatChange = useCallback((password:string) => {
    if (passwordRepeatError) {
      setPasswordRepeatError("");
    }

    if (authError) {
      clearAuthError();
    }
    setPasswordRepeat(password);
  }, [passwordRepeatError,setPasswordRepeatError, clearAuthError]);

  const handleChangePasswordVisibility = useCallback((isVisible) => {
    setShowPassword(isVisible);
  }, []);

  const handleChangePasswordRepeatVisibility = useCallback((isVisible) => {
    setShowPasswordRepeat(isVisible);
  }, []);

  async function handleSubmit(event: any) {
    event.preventDefault();

    if(!isEmailValid(email) ){
      return showAuthError("Email不合法")
    }
    const schema = new PasswordValidator();
    schema
      .is().min(8)                                    // Minimum length 8
      .is().max(100)                                  // Maximum length 100
      .has().uppercase()                              // Must have uppercase letters
      .has().lowercase()                              // Must have lowercase letters
      .has().not().spaces()                           // Should not have spaces
      .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

    console.log(schema.validate('password', { list: true }));
    if(!schema.validate(password)){
      return setPasswordError("密码需要包含大小写字母至少8个字符")
    }
    if(isOAuthLoginOk){
      const pwd1 = await sha1(password.toString());
      const params = {
        password:pwd1.toString("hex")
      }
      setAuthIsLoading(true)
      try{
        const response = await fetch(`${BASE_API}/auth/password`, {
          method: 'POST',
          headers: {
            "Accept": 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        const result = await response.json();
        if (result.err_msg) {
          return showAuthError(result.err_msg)
        }else{
          handleAuthOkJump()
        }
      }catch (e){
        showAuthError("登录异常")
      }finally {
        setAuthIsLoading(false)
      }
      return;
    }
    if(isRegMode){
      if(password != passwordRepeat){
        return setPasswordRepeatError("两次输入的密码不一致")
      }
    }
    const pwd = await sha1(password.toString());
    const params = {
      email,
      password:pwd.toString("hex")
    }
    setAuthIsLoading(true)
    try{
      const response = await fetch(`${BASE_API}/auth/${isRegMode?"reg":"login"}`, {
        method: 'POST',
        headers: {
          "Accept": 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      if (result.err_msg) {
        return showAuthError(result.err_msg)
      }else{
        handleAuthOk(result)
        handleAuthOkJump()
      }
    }catch (e){
      showAuthError("登录异常")
    }finally {
      setAuthIsLoading(false)
    }
  }

  const handleAuthOkJump = ()=>{
    updateGlobal({
      authState:"authorizationStateReady"
    });
  }
  const handleAuthOk = ({token,user})=>{
    localStorage.setItem(SESSION_TOKEN,JSON.stringify({token,user}));
    if(MsgConn.getMsgClient() && MsgConn.getMsgClient()?.getState() == MsgClientState.connected){
      MsgConn.getMsgClient()?.login(token);
    }
  }
  useEffect(()=>{
    const {query} = parseQueryFromUrl(window.location.href);
    const {code,email} = query;
    const handleToken = async ()=>{
      try{
        const response = await fetch(`${BASE_API}/auth/token`, {
          method: 'POST',
          headers: {
            "Accept": 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code
          }),
        });
        const result = await response.json();
        if(!result.err_msg){
          // setEmail(result.user.email);
          // setPasswordError("设置密码");
          // setIsOAuthLoginOk(true);
          handleAuthOk(result)
          handleAuthOkJump()
        }else{
          showAuthError(result.err_msg)
        }
      }catch (e){
        showAuthError("network error")
      }
    }
    if(code && !handleTokenGoing){
      handleTokenGoing = true;
      setEmail(email);
      setAuthIsLoading(true)
      setIsButtonShown(true);
      handleToken().then(()=>{
        window.history.replaceState({}, '', window.location.href.split("?")[0]);
      }).finally(()=>{
        handleTokenGoing = false;
        setAuthIsLoading(false)
      })
    }
  },[])

  useEffect(()=>{
    const {query} = parseQueryFromUrl(window.location.href);
    const {err_msg} = query;
    if(err_msg){
      showAuthError(err_msg)
      window.history.replaceState({}, '', window.location.href.split("?")[0]);
    }
  },[])

  return (
    <div id="auth-registration-form" className="custom-scroll">
      <div className="auth-form">
        <form action="" method="post" onSubmit={handleSubmit}>
          <h2>{lang('AppName')}</h2>
          <p className="note">Ai Chat Application</p>
          <InputText
            onFocus={clearAuthError}
            id="registration-email"
            type={"email"}
            label={"Email"}
            onChange={handleEmailChange}
            value={email}
            error={authError && lang(authError) || ""}
            autoComplete="given-name"
          />
          <PasswordForm
            clearError={()=>setPasswordError("")}
            error={passwordError && lang(passwordError)}
            isPasswordVisible={showPassword}
            onChangePasswordVisibility={handleChangePasswordVisibility}
            onInputChange={handlePasswordChange}
          />
          {
            isRegMode &&
            <PasswordForm
              placeholder={"Repeat Password"}
              clearError={()=>setPasswordRepeatError("")}
              error={passwordRepeatError && lang(passwordRepeatError)}
              isPasswordVisible={showPasswordRepeat}
              onChangePasswordVisibility={handleChangePasswordRepeatVisibility}
              onInputChange={handlePasswordRepeatChange}
            />
          }
          {isButtonShown && (
            <Button type="submit" ripple isLoading={authIsLoading}>{lang('Next')}</Button>
          )}
        </form>
        {
          !isRegMode ?
            <div className={"auth-tips"}>
                Don't have an account? <u className={"auth-tips-action"} onClick={toggleRegMode}>Sign up</u>
            </div>:
            <div className={"auth-tips"}>
              Already have an account? <u className={"auth-tips-action"} onClick={toggleRegMode}>Log in</u>
            </div>
        }

        <div className={"auth-or-line"}>
          <div className={"auth-line"}></div>
          <div className={"auth-or"}>OR</div>
        </div>
        <div className="oauth-btn">
          <Button type="button" onClick={()=>{
            window.location.href = "http://localhost:1235/auth/github";
          }} className="Button translucent round" aria-label="Github" style="">
            <img src={github} alt="Github"/>
          </Button>
          <Button type="button" onClick={()=>{
            window.location.href = "http://localhost:1235/auth/google";
          }} className="Button translucent round" aria-label="Google" style="">
            <img src={google} alt="Google"/>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): StateProps => pick(global, ['authError']),
)(AuthRegisterEmail));
