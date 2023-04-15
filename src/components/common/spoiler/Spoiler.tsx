import type {FC} from '../../../lib/teact/teact';
import React, {memo, useCallback, useEffect, useRef,} from '../../../lib/teact/teact';
import {ApiMessageEntity, ApiMessageEntityTypes} from '../../../api/types';

import {createClassNameBuilder} from '../../../util/buildClassName';
import useFlag from '../../../hooks/useFlag';

import './Spoiler.scss';
import {getPasswordFromEvent} from "../../../worker/share/utils/password";
import Account from "../../../worker/share/Account";
import useLang from "../../../hooks/useLang";
import {getActions} from "../../../global";

type OwnProps = {
  children?: React.ReactNode;
  messageId?: number;
  entity?:ApiMessageEntity
};

const READING_SYMBOLS_PER_SECOND = 23; // Heuristics
const MIN_HIDE_TIMEOUT = 5000; // 5s
const MAX_HIDE_TIMEOUT = 60000; // 1m

const actionsByMessageId: Map<number, {
  reveal: VoidFunction;
  conceal: VoidFunction;
  contentLength: number;
}[]> = new Map();

const buildClassName = createClassNameBuilder('Spoiler');

let tempText = "";
const Spoiler: FC<OwnProps> = ({
  entity,
  children,
  messageId,
}) => {
  const {showNotification} = getActions();
  // eslint-disable-next-line no-null/no-null
  const contentRef = useRef<HTMLDivElement>(null);

  const [isRevealed, reveal, conceal] = useFlag();

  const getContentLength = useCallback(() => {
    if (!contentRef.current) {
      return 0;
    }

    const textLength = contentRef.current.textContent?.length || 0;
    const emojiCount = contentRef.current.querySelectorAll('.emoji').length;
    // Optimization: ignore alt, assume that viewing emoji takes same time as viewing 4 characters
    return textLength + emojiCount * 4;
  }, []);
  const lang = useLang();
  const handleClick = useCallback(async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    if(entity){
      tempText = contentRef.current!.innerText;
      //@ts-ignore
      const {hint,cipher} = entity;
      if(cipher){
        const {password} = await getPasswordFromEvent(hint,true,'messageEncryptPassword');
        if(password === ""){
          return;
        }else{
          try {
            let plain = await Account.getCurrentAccount()?.decryptData(Buffer.from(cipher,'hex'),password)
            if(!plain){
              showNotification({message:lang("DecryptError")});
              return
            }
            contentRef.current!.innerText = plain.toString();
          }catch (e){
            showNotification({message:lang("DecryptError")});
            return
          }
        }
      }
    }
    actionsByMessageId.get(messageId!)?.forEach((actions) => actions.reveal());

    const totalContentLength = actionsByMessageId.get(messageId!)
      ?.reduce((acc, actions) => acc + actions.contentLength, 0) || 0;
    const readingMs = Math.round(totalContentLength / READING_SYMBOLS_PER_SECOND) * 1000;
    const timeoutMs = Math.max(MIN_HIDE_TIMEOUT, Math.min(readingMs, MAX_HIDE_TIMEOUT));

    setTimeout(() => {
      actionsByMessageId.get(messageId!)?.forEach((actions) => actions.conceal());
      if(contentRef.current!){
        contentRef.current!.innerText = tempText;
        tempText = ""
      }

      conceal();
    }, timeoutMs);
  }, [conceal, messageId]);

  useEffect(() => {
    if (!messageId) {
      return undefined;
    }

    const contentLength = getContentLength();

    if (actionsByMessageId.has(messageId)) {
      actionsByMessageId.get(messageId)!.push({ reveal, conceal, contentLength });
    } else {
      actionsByMessageId.set(messageId, [{ reveal, conceal, contentLength }]);
    }

    return () => {
      actionsByMessageId.delete(messageId);
    };
  }, [conceal, getContentLength, handleClick, isRevealed, messageId, reveal]);
  return (
    <span
      className={buildClassName(
        '&',
        !isRevealed && 'concealed',
        !isRevealed && Boolean(messageId) && 'animated',
      )}
      onClick={messageId && !isRevealed ? handleClick : undefined}
      data-entity-type={ApiMessageEntityTypes.Spoiler}
    >
      <span className={buildClassName('content')} ref={contentRef}>
        {children}
      </span>
    </span>
  );
};

export default memo(Spoiler);
