"use strict";(self.webpackChunktelegram_t=self.webpackChunktelegram_t||[]).push([[2239],{70172:(e,t,n)=>{n.d(t,{Z:()=>Z});var o=n(60748),r=n(33555),s=n(6137),i=n(83716),l=n(77361),c=n(56112),a=n(2155),d=n(46752),u=n(32340),m=n(6202),f=n(31212),p=n(59107),v=n(3657),g=n(35148);const h=(0,d.y)("Avatar");h.media=h("media"),h.icon=h("icon");const Z=(0,o.X$)((({className:e,size:t="large",chat:n,user:Z,photo:I,userStatus:C,text:P,isSavedMessages:b,withVideo:y,noLoop:E,loopIndefinitely:w,lastSyncTime:A,showVideoOverwrite:B,animationLevel:N,noPersonalPhoto:T,observeIntersection:k,onClick:S})=>{const{loadFullUser:U}=(0,r.Sv)(),L=(0,o.sO)(null),O=(0,o.sO)(0),R=(0,v.Op)(L,k),x=Z&&(0,c.NB)(Z),D=Z&&(0,c.pK)(Z.id),F=n?.isForum;let V,q;const H=!l.as&&N===i.zy8&&Z?.isPremium&&Z?.hasVideoAvatar,$=B&&I?.isVideo,j=R&&y&&($||H),K=Z?.fullInfo?.personalPhoto||Z?.fullInfo?.profilePhoto||Z?.fullInfo?.fallbackPhoto,M=K?.isVideo,z=j&&(M||$),_="jumbo"===t;b||x||(Z&&!T?V=(0,c.RT)(Z,_?"big":void 0):n?V=(0,c.RT)(n,_?"big":void 0):I&&(V=`photo${I.id}?size=m`,I.isVideo&&y&&(q=`videoAvatar${I.id}?size=u`)),M&&(q=(0,c.RT)(Z,void 0,"video")));const X=(0,m.Z)(V,!1,s.IU.BlobUrl,A),J=(0,m.Z)(q,!z,s.IU.BlobUrl,A),G=Boolean(X||J),Y=Boolean(R&&J&&z),{transitionClassNames:W}=(0,f.Z)(G,void 0,G,"slow"),Q=(0,o.I4)((e=>{const t=e.currentTarget;J&&(w||(O.current+=1,(O.current>=3||E)&&(t.style.display="none")))}),[w,E,J]),ee=Z?.id;(0,o.d4)((()=>{ee&&j&&!K&&U({userId:ee})}),[U,K,ee,j]);const te=(0,p.Z)();let ne;const oe=Z?(0,c.Js)(Z):n?(0,c.U)(te,n):P;if(b)ne=o.ZP.createElement("i",{className:(0,d.Z)(h.icon,"icon-avatar-saved-messages"),role:"img","aria-label":oe});else if(x)ne=o.ZP.createElement("i",{className:(0,d.Z)(h.icon,"icon-avatar-deleted-account"),role:"img","aria-label":oe});else if(D)ne=o.ZP.createElement("i",{className:(0,d.Z)(h.icon,"icon-reply-filled"),role:"img","aria-label":oe});else if(G)ne=o.ZP.createElement(o.ZP.Fragment,null,o.ZP.createElement("img",{src:X,className:(0,d.Z)(h.media,"avatar-media",W,J&&"poster"),alt:oe,decoding:"async"}),Y&&o.ZP.createElement(g.Z,{canPlay:!0,src:J,className:(0,d.Z)(h.media,"avatar-media","poster"),muted:!0,loop:w,autoPlay:!0,disablePictureInPicture:!0,playsInline:!0,onEnded:Q}));else if(Z){const e=(0,c.Js)(Z);ne=e?(0,a.Xv)(e,2):void 0}else if(n){const e=(0,c.U)(te,n);ne=e&&(0,a.Xv)(e,(0,c.YC)(n.id)?2:1)}else P&&(ne=(0,a.Xv)(P,2));const re=!b&&Z&&C&&(0,c.kM)(Z,C),se=(0,d.Z)(`Avatar size-${t}`,e,`color-bg-${(0,c.Rs)(Z||n)}`,b&&"saved-messages",x&&"deleted-account",D&&"replies-bot-account",F&&"forum",re&&"online",S&&"interactive",!b&&!X&&"no-photo"),ie=Boolean(b||X),le=(0,o.I4)((e=>{S&&S(e,ie)}),[S,ie]),ce=(Z||n)&&(Z||n).id;return o.ZP.createElement("div",{ref:L,className:se,onClick:le,"data-test-sender-id":i.Cgt?ce:void 0,"aria-label":"string"==typeof ne?oe:void 0},"string"==typeof ne?(0,u.Z)(ne,["jumbo"===t?"hq_emoji":"emoji"]):ne)}))},22275:(e,t,n)=>{n.d(t,{Z:()=>d});var o=n(60748),r=n(33555),s=n(11192),i=n(56112),l=n(32340),c=n(59107),a=n(17551);const d=(0,o.X$)((0,r.c$)(((e,{userId:t})=>{const n=(0,s.jr)(e),o=t&&(0,s.dy)(e,t);return{chat:n,contactName:o?(0,i.Vl)(o):void 0}}))((({isOpen:e,chat:t,userId:n,contactName:s,onClose:i})=>{const{deleteChatMember:d}=(0,r.Sv)(),u=(0,c.Z)(),m=(0,o.I4)((()=>{d({chatId:t.id,userId:n}),i()}),[t,d,i,n]);if(t&&n)return o.ZP.createElement(a.Z,{isOpen:e,onClose:i,title:u("GroupRemoved.Remove"),textParts:(0,l.Z)(u("PeerInfo.Confirm.RemovePeer",s)),confirmLabel:u("lng_box_remove"),confirmHandler:m,confirmIsDestructive:!0})})))},17551:(e,t,n)=>{n.d(t,{Z:()=>c});var o=n(60748),r=n(59107),s=n(72313),i=n(13103),l=n(231);const c=(0,o.X$)((({isOpen:e,onClose:t,onCloseAnimationEnd:n,title:c,header:a,text:d,textParts:u,confirmLabel:m="Confirm",confirmHandler:f,confirmIsDestructive:p,areButtonsInColumn:v,children:g})=>{const h=(0,r.Z)(),Z=(0,o.sO)(null),I=(0,o.I4)((e=>{-1===e&&f()}),[f]),C=(0,s.Z)(Z,e,I,".Button");return o.ZP.createElement(i.Z,{className:"confirm",title:c||h("Telegram"),header:a,isOpen:e,onClose:t,onCloseAnimationEnd:n},d&&d.split("\\n").map((e=>o.ZP.createElement("p",null,e))),u||g,o.ZP.createElement("div",{className:v?"dialog-buttons-column":"dialog-buttons mt-2",ref:Z,onKeyDown:C},o.ZP.createElement(l.Z,{className:"confirm-dialog-button",isText:!0,onClick:f,color:p?"danger":"primary"},m),o.ZP.createElement(l.Z,{className:"confirm-dialog-button",isText:!0,onClick:t},h("Cancel"))))}))},21273:(e,t,n)=>{n.d(t,{Z:()=>a});var o=n(91713),r=n(60748),s=n(69118),i=n(87675),l=n(77361),c=n(80036);const a=({ref:e,className:t,items:n,itemSelector:a=".ListItem",preloadBackwards:d=20,sensitiveArea:u=800,withAbsolutePositioning:m,maxHeight:f,noScrollRestore:p=!1,noScrollRestoreOnTop:v=!1,noFastList:g,cacheBuster:h,beforeChildren:Z,children:I,onLoadMore:C,onScroll:P,onKeyDown:b,onDragOver:y,onDragLeave:E})=>{let w=(0,r.sO)(null);e&&(w=e);const A=(0,r.sO)({}),[B,N]=(0,r.Ye)((()=>C?[(0,s.Ds)(((e=!1)=>{C({direction:o.Uq.Backwards,noScroll:e})}),1e3,!0,!1),(0,s.Ds)((()=>{C({direction:o.Uq.Forwards})}),1e3,!0,!1)]:[]),[C,n]);(0,r.d4)((()=>{if(!B)return;if(d>0&&(!n||n.length<d))return void B(!0);const{scrollHeight:e,clientHeight:t}=w.current;t&&e<=t&&B()}),[n,B,d]),(0,r.bt)((()=>{const e=w.current,t=A.current;let n;if(t.listItemElements=e.querySelectorAll(a),t.currentAnchor&&Array.from(t.listItemElements).includes(t.currentAnchor)){const{scrollTop:o}=e;n=o+(t.currentAnchor.getBoundingClientRect().top-t.currentAnchorTop)}else{const e=t.listItemElements[0];e&&(t.currentAnchor=e,t.currentAnchorTop=e.getBoundingClientRect().top)}m||p||v&&0===e.scrollTop||((0,i.Z)(e,n),t.isScrollTopJustUpdated=!0)}),[n,a,p,v,h,m]);const T=(0,r.I4)((e=>{if(N&&B){const{isScrollTopJustUpdated:e,currentAnchor:t,currentAnchorTop:n}=A.current,o=A.current.listItemElements;if(e)return void(A.current.isScrollTopJustUpdated=!1);const r=o.length,s=w.current,{scrollTop:i,scrollHeight:l,offsetHeight:c}=s,a=i<=(r?o[0].offsetTop:0)+u,d=(r?o[r-1].offsetTop+o[r-1].offsetHeight:l)-(i+c)<=u;let m=!1;if(a){const e=o[0];if(e){const o=e.getBoundingClientRect().top,r=t?.offsetParent&&t!==e?t.getBoundingClientRect().top:o;t&&void 0!==n&&r>n&&(A.current.currentAnchor=e,A.current.currentAnchorTop=o,m=!0,N())}}if(d){const e=o[r-1];if(e){const o=e.getBoundingClientRect().top,r=t?.offsetParent&&t!==e?t.getBoundingClientRect().top:o;t&&void 0!==n&&r<n&&(A.current.currentAnchor=e,A.current.currentAnchorTop=o,m=!0,B())}}if(!m)if(t?.offsetParent)A.current.currentAnchorTop=t.getBoundingClientRect().top;else{const e=o[0];e&&(A.current.currentAnchor=e,A.current.currentAnchorTop=e.getBoundingClientRect().top)}}P&&P(e)}),[B,N,P,u]);return r.ZP.createElement("div",{ref:w,className:t,onScroll:T,teactFastList:!g&&!m,onKeyDown:b,onDragOver:y,onDragLeave:E},Z,m&&n?.length?r.ZP.createElement("div",{teactFastList:!g,style:(0,c.Z)("position: relative",l.wZ&&`height: ${f}px`)},I):I)}},13103:(e,t,n)=>{n.d(t,{Z:()=>p});var o=n(60748),r=n(517),s=n(46752),i=n(98069),l=n(18674),c=n(31212),a=n(274),d=n(59107),u=n(46590),m=n(231),f=n(62898);const p=({dialogRef:e,title:t,className:n,isOpen:p,isSlim:v,header:g,hasCloseButton:h,noBackdrop:Z,noBackdropClose:I,children:C,style:P,onClose:b,onCloseAnimationEnd:y,onEnter:E,shouldSkipHistoryAnimations:w})=>{const{shouldRender:A,transitionClassNames:B}=(0,c.Z)(p,y,w,void 0,w),N=(0,o.sO)(null);(0,o.d4)((()=>{if(p)return(0,i.l_)(),i.In}),[p]),(0,o.d4)((()=>p?(0,r.Z)({onEsc:b,onEnter:E}):void 0),[p,b,E]),(0,o.d4)((()=>p&&N.current?function(e){function t(t){if("Tab"!==t.key)return;t.preventDefault(),t.stopPropagation();const n=Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));if(!n.length)return;const o=n.findIndex((e=>e.isSameNode(document.activeElement)));let r=0;o>=0&&(r=t.shiftKey?o>0?o-1:n.length-1:o<n.length-1?o+1:0),n[r].focus()}return document.addEventListener("keydown",t,!1),()=>{document.removeEventListener("keydown",t,!1)}}(N.current):void 0),[p]),(0,u.Z)({isActive:p,onBack:b}),(0,a.Z)((([e])=>(document.body.classList.toggle("has-open-dialog",Boolean(p)),(p||!p&&void 0!==e)&&(0,l.YW)(200),()=>{document.body.classList.remove("has-open-dialog")})),[p]);const T=(0,d.Z)();if(!A)return;const k=(0,s.Z)("Modal",n,B,Z&&"transparent-backdrop",v&&"slim");return o.ZP.createElement(f.Z,null,o.ZP.createElement("div",{ref:N,className:k,tabIndex:-1,role:"dialog"},o.ZP.createElement("div",{className:"modal-container"},o.ZP.createElement("div",{className:"modal-backdrop",onClick:I?void 0:b}),o.ZP.createElement("div",{className:"modal-dialog",ref:e},g||(t?o.ZP.createElement("div",{className:"modal-header"},h&&o.ZP.createElement(m.Z,{round:!0,color:"translucent",size:"smaller",ariaLabel:T("Close"),onClick:b},o.ZP.createElement("i",{className:"icon-close"})),o.ZP.createElement("div",{className:"modal-title"},t)):void 0),o.ZP.createElement("div",{className:"modal-content custom-scroll",style:P},C)))))}},42431:(e,t,n)=>{n.d(t,{$5:()=>l,Bj:()=>i,GU:()=>c,Ht:()=>a,fu:()=>u,mU:()=>d});var o=n(14342),r=n(56112),s=n(86087);function i(e,t){const n=(0,o.Z1)(e,t);if(n&&n.fullInfo&&n.fullInfo.groupCallId)return l(e,n.fullInfo.groupCallId)}function l(e,t){return e.groupCalls.byId[t]}function c(e,t,n){return l(e,t)?.participants[n]}function a(e){const t=d(e)?.chatId;if(!t)return!1;const n=(0,o.Z1)(e,t);return!!n&&((0,r.G9)(n)&&n.isCreator||Boolean(n.adminRights?.manageCall))}function d(e){const{groupCalls:{activeGroupCallId:t}}=e;if(t)return l(e,t)}function u(e){const{phoneCall:t,currentUserId:n}=e;if(!t||!t.participantId||!t.adminId)return;const o=t.adminId===n?t.participantId:t.adminId;return(0,s.dy)(e,o)}},9211:(e,t,n)=>{n.d(t,{M:()=>s,P:()=>i});var o=n(86087),r=n(83716);function s(e,t){var n;const{appConfig:s}=e;if(!s)return r.prK[t][0];const i=(0,o.wV)(e),{limits:l}=s,c=null!==(n=l[t][i?1:0])&&void 0!==n?n:r.prK[t][i?1:0];return"dialogFilters"===t?c+1:c}function i(e,t){const{appConfig:n}=e;if(!n)return r.prK[t][1];const{limits:o}=n;return o[t][1]}},27407:(e,t,n)=>{n.d(t,{Z:()=>a});var o=n(60748),r=n(91713),s=n(60782),i=n(65326),l=n(87204);function c(e,t,n,o){const{length:s}=e,i=o?e.indexOf(o):0,l=t===r.Uq.Forwards?i:i+1||s,c=Math.max(0,l-n),a=l+n-1,d=e.slice(Math.max(0,c),a+1);let u,m;switch(t){case r.Uq.Forwards:u=l>0,m=c>=0;break;case r.Uq.Backwards:u=l<s,m=a<=s-1}return{newViewportIds:d,areSomeLocal:u,areAllLocal:m}}const a=(e,t,n=!1,a=30)=>{const d=(0,o.sO)(),u=(0,o.sO)((()=>{if(!t||d.current)return;const{newViewportIds:e}=c(t,r.Uq.Forwards,a,t[0]);return e})()),m=(0,i.Z)();n&&(d.current={});const f=(0,l.Z)(t),p=(0,l.Z)(n);if(!t||n||t===f&&n===p)t||(u.current=void 0);else{const{offsetId:e=t[0],direction:n=r.Uq.Forwards}=d.current||{},{newViewportIds:o}=c(t,n,a,e);u.current&&(0,s.et)(u.current,o)||(u.current=o)}const v=(0,o.I4)((({direction:n,noScroll:o})=>{const i=u.current,l=i?n===r.Uq.Backwards?i[i.length-1]:i[0]:void 0;if(!t)return void(e&&e({offsetId:l}));o||(d.current={...d.current,direction:n,offsetId:l});const{newViewportIds:f,areSomeLocal:p,areAllLocal:v}=c(t,n,a,l);!p||i&&(0,s.et)(i,f)||(u.current=f,m()),!v&&e&&e({offsetId:l})}),[t,a,e,m]);return n?[t]:[u.current,v]}},62357:(e,t,n)=>{n.d(t,{Z:()=>r});var o=n(60748);const r=function(e,t,n=!1){const r=(0,o.sO)(e);(0,o.bt)((()=>{r.current=e}),[e]),(0,o.d4)((()=>{if(void 0===t)return;const e=setInterval((()=>r.current()),t);return n||r.current(),()=>clearInterval(e)}),[t,n])}},98069:(e,t,n)=>{n.d(t,{In:()=>s,l_:()=>r,wT:()=>i});let o=0;function r(){o+=1}function s(){o-=1}function i(){return o>0}},87675:(e,t,n)=>{n.d(t,{Z:()=>i,z:()=>s});var o=n(77361),r=n(82972);function s(e){e.style.display="none",(0,r.Z)(e),e.style.display=""}const i=(e,t)=>{o.cj&&(e.style.overflow="hidden"),void 0!==t&&(e.scrollTop=t),o.cj&&(e.style.overflow="")}}}]);
//# sourceMappingURL=2239.1e7d9083a1bffc3adc81.js.map