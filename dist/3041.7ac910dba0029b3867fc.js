(self.webpackChunktelegram_t=self.webpackChunktelegram_t||[]).push([[3041],{18118:(e,t,n)=>{"use strict";n.r(t),n.d(t,{AuthCode:()=>Z,AuthPassword:()=>w,AuthRegister:()=>b,AuthRegisterEmail:()=>B,AuthSignPassword:()=>U});var r=n(60748),a=n(33555),o=n(77361),i=n(60782),s=n(32340),l=n(46590),c=n(59107),u=n(97687),d=n(34288),m=n(83716),h=n(62821),g=n(42797),f=n(97799);const p=(0,r.X$)((({code:e,codeLength:t,trackingDirection:n,isTracking:a,isBig:o})=>{const[i,s]=(0,r.eJ)(!1),{isMobile:l}=(0,g.ZP)(),c=165/t,u=l?m.qpg:m.z7m,d=(0,r.I4)((()=>s(!0)),[]);return r.ZP.createElement("div",{id:"monkey",className:o?"big":""},!i&&r.ZP.createElement("div",{className:"monkey-preview"}),r.ZP.createElement(f.Z,{size:o?m.K2q:u,className:a?"hidden":void 0,tgsUrl:h.l.MonkeyIdle,play:!a,onLoad:d}),r.ZP.createElement(f.Z,{size:o?m.K2q:u,className:a?"shown":"hidden",tgsUrl:h.l.MonkeyTracking,playSegment:a?function(){const r=e&&e.length>1||n<0?15+c*(e.length-1):0,a=e.length===t?180:15+c*e.length;return n<1?[a,r]:[r,a]}():void 0,speed:2,noLoop:!0}))})),Z=(0,r.X$)((0,a.c$)((e=>(0,i.ei)(e,["authPhoneNumber","authIsCodeViaApp","authIsLoading","authError"])))((({authPhoneNumber:e,authIsCodeViaApp:t,authIsLoading:n,authError:i})=>{const{setAuthCode:m,returnToAuthPhoneNumber:h,clearAuthError:g}=(0,a.Sv)(),f=(0,c.Z)(),Z=(0,r.sO)(null),[P,E]=(0,r.eJ)(""),[w,v]=(0,r.eJ)(!1),[y,b]=(0,r.eJ)(1);(0,r.d4)((()=>{o.$b||Z.current.focus()}),[]),(0,l.Z)({isActive:!0,onBack:h});const C=(0,r.I4)((e=>{i&&g();const{currentTarget:t}=e;t.value=t.value.replace(/[^\d]+/,"").substr(0,5),t.value!==P&&(E(t.value),w?t.value.length||v(!1):v(!0),P&&P.length>t.value.length?b(-1):b(1),5===t.value.length&&m({code:t.value}))}),[i,g,P,w,m]);return r.ZP.createElement("div",{id:"auth-code-form",className:"custom-scroll"},r.ZP.createElement("div",{className:"auth-form"},r.ZP.createElement(p,{code:P,codeLength:5,isTracking:w,trackingDirection:y}),r.ZP.createElement("h1",null,e,r.ZP.createElement("div",{className:"auth-number-edit",onClick:function(){h()},role:"button",tabIndex:0,title:f("WrongNumber")},r.ZP.createElement("i",{className:"icon-edit"}))),r.ZP.createElement("p",{className:"note"},(0,s.Z)(f(t?"SentAppCode":"Login.JustSentSms"),["simple_markdown"])),r.ZP.createElement(u.Z,{ref:Z,id:"sign-in-code",label:f("Code"),onInput:C,value:P,error:i&&f(i),autoComplete:"off",inputMode:"numeric"}),n&&r.ZP.createElement(d.Z,null)))})));var P=n(93490),E=n(99364);const w=(0,r.X$)((0,a.c$)((e=>(0,i.ei)(e,["authIsLoading","authError","authHint"])))((({authIsLoading:e,authError:t,authHint:n})=>{const{setAuthPassword:o,clearAuthError:i}=(0,a.Sv)(),s=(0,c.Z)(),[l,u]=(0,r.eJ)(!1),d=(0,r.I4)((e=>{u(e)}),[]),m=(0,r.I4)((e=>{o({password:e})}),[o]);return r.ZP.createElement("div",{id:"auth-password-form",className:"custom-scroll"},r.ZP.createElement("div",{className:"auth-form"},r.ZP.createElement(P.Z,{isPasswordVisible:l}),r.ZP.createElement("h1",null,s("Login.Header.Password")),r.ZP.createElement("p",{className:"note"},s("Login.EnterPasswordDescription")),r.ZP.createElement(E.Z,{clearError:i,error:t&&s(t),hint:n,isLoading:e,isPasswordVisible:l,onChangePasswordVisibility:d,onSubmit:m})))})));var v=n(231),y=n(90730);const b=(0,r.X$)((0,a.c$)((e=>(0,i.ei)(e,["authIsLoading","authError"])))((({authIsLoading:e,authError:t})=>{const{signUp:n,clearAuthError:o,uploadProfilePhoto:i}=(0,a.Sv)(),s=(0,c.Z)(),[l,d]=(0,r.eJ)(!1),[m,h]=(0,r.eJ)(),[g,f]=(0,r.eJ)(""),[p,Z]=(0,r.eJ)(""),P=(0,r.I4)((e=>{t&&o();const{target:n}=e;f(n.value),d(n.value.length>0)}),[t,o]),E=(0,r.I4)((e=>{const{target:t}=e;Z(t.value)}),[]);return r.ZP.createElement("div",{id:"auth-registration-form",className:"custom-scroll"},r.ZP.createElement("div",{className:"auth-form"},r.ZP.createElement("form",{action:"",method:"post",onSubmit:function(e){e.preventDefault(),n({firstName:g,lastName:p}),m&&i({file:m})}},r.ZP.createElement(y.Z,{onChange:h}),r.ZP.createElement("h2",null,s("YourName")),r.ZP.createElement("p",{className:"note"},s("Login.Register.Desc")),r.ZP.createElement(u.Z,{id:"registration-first-name",label:s("Login.Register.FirstName.Placeholder"),onChange:P,value:g,error:t&&s(t),autoComplete:"given-name"}),r.ZP.createElement(u.Z,{id:"registration-last-name",label:s("Login.Register.LastName.Placeholder"),onChange:E,value:p,autoComplete:"family-name"}),l&&r.ZP.createElement(v.Z,{type:"submit",ripple:!0,isLoading:e},s("Next")))))}))),C=n.p+"github.cc5da41cefbfea31a26e.svg",N=n.p+"google.324ab349caf94c572718.svg";var I=n(89618),S=n(2133),k=n(58730),A=n(44567);let L=!1;const B=(0,r.X$)((0,a.c$)((e=>(0,i.ei)(e,["authError"])))((({authError:e})=>{const{clearAuthError:t,showAuthError:n,updateGlobal:o}=(0,a.Sv)(),i=(0,c.Z)(),[s,l]=(0,r.eJ)(!1),[d,h]=(0,r.eJ)(!1),[f,p]=(0,r.eJ)(m.IKD),[Z,P]=(0,r.eJ)((0,S.Ju)(f)),[w,y]=(0,r.eJ)(m.vSM),[b,B]=(0,r.eJ)(""),[J,x]=(0,r.eJ)(""),[_,M]=(0,r.eJ)(""),[T,R]=(0,r.eJ)(!1),[$,z]=(0,r.eJ)(!1),[U,D]=(0,r.eJ)(!1),O=(0,r.I4)((e=>{h(!d)}),[d]),V=(0,r.I4)((n=>{e&&t();const{target:r}=n;p(r.value),P((0,S.Ju)(r.value))}),[e,t]),q=(0,r.I4)((n=>{J&&x(""),e&&t(),y(n)}),[J,x,t]),H=(0,r.I4)((n=>{_&&M(""),e&&t(),B(n)}),[_,M,t]),j=(0,r.I4)((e=>{z(e)}),[]),K=(0,r.I4)((e=>{D(e)}),[]),F=()=>{o({authState:"authorizationStateReady"})},X=({token:e,user:t})=>{localStorage.setItem(m.IPc,JSON.stringify({token:e,user:t})),k.ZP.getMsgClient()&&k.ZP.getMsgClient()?.getState()==k.Pk.connected&&k.ZP.getMsgClient()?.login(e)};(0,r.d4)((()=>{const{query:e}=(0,S.k1)(window.location.href),{code:t,email:r}=e;t&&!L&&(L=!0,p(r),R(!0),P(!0),(async()=>{try{const e=await fetch(`${m.t3z}/auth/token`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({code:t})}),r=await e.json();r.err_msg?n(r.err_msg):(X(r),F())}catch(e){n("network error")}})().then((()=>{window.history.replaceState({},"",window.location.href.split("?")[0])})).finally((()=>{L=!1,R(!1)})))}),[]),(0,r.d4)((()=>{const{query:e}=(0,S.k1)(window.location.href),{err_msg:t}=e;t&&(n(t),window.history.replaceState({},"",window.location.href.split("?")[0]))}),[]);const W=(0,r.I4)((()=>{o({authState:"authorizationStateReady"})}),[o]),G=(0,g.W7)();return r.ZP.createElement("div",{id:"auth-registration-form",className:"custom-scroll"},r.ZP.createElement("div",{className:"auth-close"},r.ZP.createElement(v.Z,{round:!0,color:"translucent",size:"smaller",ariaLabel:i("Close"),onClick:W},r.ZP.createElement("i",{className:"icon-close"}))),r.ZP.createElement("div",{className:"auth-form"},r.ZP.createElement("form",{action:"",method:"post",onSubmit:async function(e){if(e.preventDefault(),!(0,S.Ju)(f))return n("Email不合法");if(!(0,A.t)(w))return x(i("PasswordTipsCheck"));if(s){const e={password:(await(0,I.sha1)(w.toString())).toString("hex")};R(!0);try{const t=await fetch(`${m.t3z}/auth/password`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(e)}),r=await t.json();if(r.err_msg)return n(r.err_msg);F()}catch(e){n("登录异常")}finally{R(!1)}return}if(d&&w!=b)return M("两次输入的密码不一致");const t=w===m.vSM?"da39a3ee5e6b4b0d3255bfef95601890afd80709":await(0,I.sha1)(w.toString()),r={email:f,password:t.toString("hex")};R(!0);try{const e=await fetch(`${m.t3z}/auth/${d?"reg":"login"}`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(r)}),t=await e.json();if(t.err_msg)return n(t.err_msg);X(t),F()}catch(e){n("登录异常")}finally{R(!1)}}},r.ZP.createElement("h2",null,"WAI"),r.ZP.createElement("p",{className:"note"},"An Ai Chat Application"),r.ZP.createElement(u.Z,{onFocus:t,id:"registration-email",type:"email",label:"Email",onChange:V,value:f,error:e&&i(e)||"",autoComplete:"given-name"}),r.ZP.createElement(E.Z,{clearError:()=>x(""),error:J&&i(J),isPasswordVisible:$,onChangePasswordVisibility:j,onInputChange:q}),d&&r.ZP.createElement(E.Z,{placeholder:"Repeat Password",clearError:()=>M(""),error:_&&i(_),isPasswordVisible:U,onChangePasswordVisibility:K,onInputChange:H}),Z&&r.ZP.createElement(v.Z,{type:"submit",ripple:!0,isLoading:T},i("Next"))),d?r.ZP.createElement("div",{className:"auth-tips"},"Already have an account? ",r.ZP.createElement("u",{className:"auth-tips-action",onClick:O},"Log in")):r.ZP.createElement("div",{className:"auth-tips"},"Don't have an account? ",r.ZP.createElement("u",{className:"auth-tips-action",onClick:O},"Sign up")),r.ZP.createElement("div",{className:"auth-or-line"},r.ZP.createElement("div",{className:"auth-line"}),r.ZP.createElement("div",{className:"auth-or"},"OR")),r.ZP.createElement("div",{className:"oauth-btn"},r.ZP.createElement(v.Z,{type:"button",onClick:()=>{window.location.href=`${m.t3z}/auth/github`},className:"Button translucent round","aria-label":"Github",style:""},r.ZP.createElement("img",{src:C,alt:"Github"})),r.ZP.createElement(v.Z,{type:"button",onClick:()=>{window.location.href=`${m.t3z}/auth/google`},className:"Button translucent round","aria-label":"Google",style:""},r.ZP.createElement("img",{src:N,alt:"Google"})))),G&&r.ZP.createElement("div",{style:"height:500px"}))})));var J=n(59174),x=n(93968),_=n(39793),M=n(45702),T=n(82752),R=n(63024),$=n(95281),z=n(48764).Buffer;const U=(0,r.X$)((0,a.c$)((e=>(0,i.ei)(e,["authIsLoading","authError","authHint"])))((({authIsLoading:e,authError:t,authHint:n})=>{const{setAuthPassword:o,clearAuthError:i,showAuthError:s}=(0,a.Sv)(),l=(0,c.Z)(),[u,d]=(0,r.eJ)(!1),[m,h]=(0,r.eJ)(""),[g,f]=(0,r.eJ)(""),[p,Z]=(0,r.eJ)(!1),w=()=>{const e=m.trim().split(" ");return(0===m.trim().length?0:e.length).toString()},y=(0,r.I4)((()=>{Z(!p),h("")}),[p,Z]),b=(0,r.I4)((()=>{const e=new x.Z;h(e.getWords())}),[h]),C=(0,r.I4)((e=>{const t=e.target.files[0],n=new _.h,r=new Blob([t],{type:t.type}),a=URL.createObjectURL(r);n.scan(a).then((e=>{h(e.data)})).catch((e=>{alert("二维码解析失败")}))}),[h]),N=(0,r.I4)((()=>{document.querySelector("#upload_qrcode").click()}),[h]),I=(0,r.I4)((e=>{f(""),h(e.target.value)}),[]),S=(0,r.I4)((e=>{d(e)}),[]),k=(0,r.I4)((async e=>{if(!(0,A.t)(e))return s(l("PasswordTipsCheck"));let t=m.trim();if(p){if(m.startsWith("wai://")){const n=m.replace("wai://",""),r=z.from(n,"hex"),a=M.zF.parseMsg(new T.es(r));if(!a)return f("解析二维码失败");{const{type:n,data:r}=a;if(n!==R.I.QrCodeType_MNEMONIC)return f("解析二维码失败");try{const n=await(0,$.jz)(r,z.from((0,A.n)(e),"hex"));if(!n)return f("解析二维码失败");t=n.toString()}catch(e){return f("解密二维码失败")}}}else if("12"!==w())return f("助记词需12个单词");if(!new x.Z(t).checkMnemonic())return f("助记词不合法，请输入12个单词,用空格分割")}o({password:e,mnemonic:t})}),[o,m]),L=(0,r.I4)((()=>{(0,a.Sv)().updateGlobal({authState:"authorizationStateReady"})}),[o]);return r.ZP.createElement("div",{id:"auth-password-form",className:"custom-scroll"},r.ZP.createElement("div",{className:"auth-close"},r.ZP.createElement(v.Z,{round:!0,color:"translucent",size:"smaller",ariaLabel:l("Close"),onClick:L},r.ZP.createElement("i",{className:"icon-close"}))),r.ZP.createElement("div",{className:"auth-form"},r.ZP.createElement(P.Z,{isPasswordVisible:u}),r.ZP.createElement("h1",null,p?"助记词导入":l("Login.Header.Password")),r.ZP.createElement("p",{className:"note"}),p&&r.ZP.createElement(J.Z,{noReplaceNewlines:!0,error:g||"",inputMode:"text",value:m,onChange:I,label:"助记词",disabled:e,maxLength:1e3,maxLengthIndicator:w()}),r.ZP.createElement(E.Z,{clearError:i,error:t&&l(t),hint:l("PasswordTipsLoginPlaceholder"),isLoading:e,isPasswordVisible:u,onChangePasswordVisibility:S,onSubmit:k}),r.ZP.createElement("div",{className:"auth-or-line"},r.ZP.createElement("div",{className:"auth-line"}),r.ZP.createElement("div",{className:"auth-or"},"OR")),p&&r.ZP.createElement(v.Z,{isText:!0,onClick:b},"助记词生成"),p&&r.ZP.createElement(r.ZP.Fragment,null,r.ZP.createElement("input",{style:"display:none",onChange:C,type:"file",id:"upload_qrcode"}),r.ZP.createElement(v.Z,{isText:!0,onClick:N},"二维码登录")),r.ZP.createElement(v.Z,{isText:!0,onClick:y},p?"密码登录":"助记词登录")))})))},99364:(e,t,n)=>{"use strict";n.d(t,{Z:()=>m});var r=n(60748),a=n(83716),o=n(77361),i=n(46752),s=n(3858),l=n(59107),c=n(28183),u=n(42797),d=n(231);const m=(0,r.X$)((({isLoading:e=!1,isPasswordVisible:t,error:n,hint:m,placeholder:h="Password",submitLabel:g="Next",description:f,shouldShowSubmit:p,shouldResetValue:Z,shouldDisablePasswordManager:P=!1,noRipple:E=!1,clearError:w,onChangePasswordVisibility:v,onInputChange:y,onSubmit:b})=>{const C=(0,r.sO)(null),N=(0,l.Z)(),{isMobile:I}=(0,u.ZP)(),[S,k]=(0,r.eJ)(a.vSM),[A,L]=(0,r.eJ)(!1),B=I?550:400;return(0,r.d4)((()=>{Z&&!a.vSM&&k("")}),[Z]),(0,c.Z)((()=>{o.$b||C.current.focus(),C&&C.current.value&&L(!0)}),B),(0,r.d4)((()=>{n&&requestAnimationFrame((()=>{C.current.focus(),C.current.select()}))}),[n]),r.ZP.createElement("form",{action:"",onSubmit:b?function(t){t.preventDefault(),e||A&&b(S)}:s.Z,autoComplete:"off"},r.ZP.createElement("div",{className:(0,i.Z)("input-group password-input",S&&"touched",n&&"error"),dir:N.isRtl?"rtl":void 0},P&&r.ZP.createElement("input",{type:"password",id:"prevent_autofill",autoComplete:"off",className:"visually-hidden",tabIndex:-2}),r.ZP.createElement("input",{onKeyDown:e=>{if("Enter"==e.code&&!b)return e.preventDefault(),e.stopPropagation(),!1},ref:C,className:"form-control",type:t?"text":"password",id:"sign-in-password",value:S||"",multiple:!0,autoComplete:P?"one-time-code":"current-password",onChange:function(e){n&&w();const{target:t}=e;k(t.value),L(t.value.length>=a.loe),y&&y(t.value)},maxLength:256,dir:"auto"}),r.ZP.createElement("label",null,n||m||h),r.ZP.createElement("div",{className:"toggle-password",onClick:function(){v(!t)},role:"button",tabIndex:0,title:"Toggle password visibility"},r.ZP.createElement("i",{className:t?"icon-eye":"icon-eye-closed"}))),f&&r.ZP.createElement("p",{className:"description"},f),b&&(A||p)&&r.ZP.createElement(d.Z,{type:"submit",ripple:!E,isLoading:e,disabled:!A},g))}))},93490:(e,t,n)=>{"use strict";n.d(t,{Z:()=>h});var r=n(60748),a=n(83716),o=n(62821),i=n(97799),s=n(28183),l=n(60706),c=n(42797);const u=[0,50],d=[0,20],m=[20,0],h=(0,r.X$)((({isPasswordVisible:e,isBig:t})=>{const[n,h]=(0,l.Z)(!1),[g,f]=(0,l.Z)(!1),{isMobile:p}=(0,c.ZP)(),Z=p?a.qpg:a.z7m;(0,s.Z)(f,2e3);const P=(0,r.I4)(h,[h]);return r.ZP.createElement("div",{id:"monkey",className:t?"big":""},!n&&r.ZP.createElement("div",{className:"monkey-preview"}),r.ZP.createElement(i.Z,{size:t?a.K2q:Z,className:g?"hidden":"shown",tgsUrl:o.l.MonkeyClose,playSegment:u,noLoop:!0,onLoad:P}),r.ZP.createElement(i.Z,{size:t?a.K2q:Z,className:g?"shown":"hidden",tgsUrl:o.l.MonkeyPeek,playSegment:e?d:m,noLoop:!0}))}))},66735:(e,t,n)=>{"use strict";n.d(t,{Z:()=>g});var r=n(60748),a=n(83716),o=n(71394),i=n(59107),s=n(231),l=n(13103),c=n(34288);const u={type:"blob",quality:1,format:"jpeg",circle:!1,size:{width:1024,height:1024}};let d,m,h;const g=(0,r.X$)((({file:e,onChange:t,onClose:g})=>{const[f,p]=(0,r.eJ)(!1);(0,r.d4)((()=>{e&&(f?async function(e){try{const t=document.getElementById("avatar-crop");if(!t)return;const{offsetWidth:n,offsetHeight:r}=t;h=new d(t,{enableZoom:!0,boundary:{width:n,height:r},viewport:{width:n-16,height:r-16,type:"circle"}});const a=await(0,o.YJ)(e);await h.bind({url:a})}catch(e){a.eMD&&console.error(e)}}(e):async function(){return m||(m=Promise.all([n.e(5099),n.e(3472)]).then(n.bind(n,23472)),d=(await m).default),m}().then((()=>p(!0))))}),[e,f]);const Z=(0,i.Z)(),P=(0,r.I4)((async()=>{if(!h)return;const e=await h.result(u),n="string"==typeof e?e:(0,o.hl)(e,"avatar.jpg");t(n)}),[t]);return r.ZP.createElement(l.Z,{isOpen:Boolean(e),onClose:g,title:"Drag to reposition",className:"CropModal",hasCloseButton:!0},f?r.ZP.createElement("div",{id:"avatar-crop"}):r.ZP.createElement(c.Z,null),r.ZP.createElement(s.Z,{className:"confirm-button",round:!0,color:"primary",onClick:P,ariaLabel:Z("CropImage")},r.ZP.createElement("i",{className:"icon-check"})))}))},13103:(e,t,n)=>{"use strict";n.d(t,{Z:()=>g});var r=n(60748),a=n(517),o=n(46752),i=n(98069),s=n(18674),l=n(31212),c=n(274),u=n(59107),d=n(46590),m=n(231),h=n(62898);const g=({dialogRef:e,title:t,className:n,isOpen:g,isSlim:f,header:p,hasCloseButton:Z,noBackdrop:P,noBackdropClose:E,children:w,style:v,onClose:y,onCloseAnimationEnd:b,onEnter:C,shouldSkipHistoryAnimations:N})=>{const{shouldRender:I,transitionClassNames:S}=(0,l.Z)(g,b,N,void 0,N),k=(0,r.sO)(null);(0,r.d4)((()=>{if(g)return(0,i.l_)(),i.In}),[g]),(0,r.d4)((()=>g?(0,a.Z)({onEsc:y,onEnter:C}):void 0),[g,y,C]),(0,r.d4)((()=>g&&k.current?function(e){function t(t){if("Tab"!==t.key)return;t.preventDefault(),t.stopPropagation();const n=Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));if(!n.length)return;const r=n.findIndex((e=>e.isSameNode(document.activeElement)));let a=0;r>=0&&(a=t.shiftKey?r>0?r-1:n.length-1:r<n.length-1?r+1:0),n[a].focus()}return document.addEventListener("keydown",t,!1),()=>{document.removeEventListener("keydown",t,!1)}}(k.current):void 0),[g]),(0,d.Z)({isActive:g,onBack:y}),(0,c.Z)((([e])=>(document.body.classList.toggle("has-open-dialog",Boolean(g)),(g||!g&&void 0!==e)&&(0,s.YW)(200),()=>{document.body.classList.remove("has-open-dialog")})),[g]);const A=(0,u.Z)();if(!I)return;const L=(0,o.Z)("Modal",n,S,P&&"transparent-backdrop",f&&"slim");return r.ZP.createElement(h.Z,null,r.ZP.createElement("div",{ref:k,className:L,tabIndex:-1,role:"dialog"},r.ZP.createElement("div",{className:"modal-container"},r.ZP.createElement("div",{className:"modal-backdrop",onClick:E?void 0:y}),r.ZP.createElement("div",{className:"modal-dialog",ref:e},p||(t?r.ZP.createElement("div",{className:"modal-header"},Z&&r.ZP.createElement(m.Z,{round:!0,color:"translucent",size:"smaller",ariaLabel:A("Close"),onClick:y},r.ZP.createElement("i",{className:"icon-close"})),r.ZP.createElement("div",{className:"modal-title"},t)):void 0),r.ZP.createElement("div",{className:"modal-content custom-scroll",style:v},w)))))}},28183:(e,t,n)=>{"use strict";n.d(t,{Z:()=>a});var r=n(60748);const a=function(e,t){const n=(0,r.sO)(e);(0,r.bt)((()=>{n.current=e}),[e]),(0,r.d4)((()=>{if("number"!=typeof t)return;const e=setTimeout((()=>n.current()),t);return()=>clearTimeout(e)}),[t])}},89618:(e,t,n)=>{var r=n(48764).Buffer;const a=n(24736),o=n(66842);function i(e,t=!0,n=!1){let o=r.from(e);const i=o.length;t&&(o=o.reverse());let s=a(o.toString("hex"),16);return n&&Math.floor(s.toString("2").length/8)>=i&&(s=s.subtract(a(2).pow(a(8*i)))),s}function s(e,t=8){const n=a(e),o=[];for(let e=0;e<t;e++)o[e]=n.shiftRight(8*e).and(255);return r.from(o)}function l(e,t,n=!0,o=!1){const i=(e=a(e)).bitLength();if(t<Math.ceil(i/8))throw new Error("OverflowError: int too big to convert");if(!o&&e.lesser(a(0)))throw new Error("Cannot convert to unsigned");let s=!1;e.lesser(a(0))&&(s=!0,e=e.abs());const l=e.toString("16").padStart(2*t,"0");let c=r.from(l,"hex");if(n&&(c=c.reverse()),o&&s)if(n){let e=!1;0!==c[0]&&(c[0]-=1);for(let t=0;t<c.length;t++)0!==c[t]?(e&&(c[t]-=1,e=!1),c[t]=255-c[t]):e=!0}else{c[c.length-1]=256-c[c.length-1];for(let e=0;e<c.length-1;e++)c[e]=255-c[e]}return c}function c(e){return r.from(o.randomBytes(e))}function u(e){const t=o.createHash("sha1");return t.update(e),t.digest()}let d;e.exports={readBigIntFromBuffer:i,readBufferFromBigInt:l,generateRandomLong:function(e=!0){return i(c(8),!0,e)},mod:function(e,t){return(e%t+t)%t},crc32:function(e){d||(d=function(){let e;const t=[];for(let n=0;n<256;n++){e=n;for(let t=0;t<8;t++)e=1&e?3988292384^e>>>1:e>>>1;t[n]=e}return t}()),r.isBuffer(e)||(e=r.from(e));let t=-1;for(let n=0;n<e.length;n++){const r=e[n];t=d[255&(t^r)]^t>>>8}return(-1^t)>>>0},generateRandomBytes:c,generateKeyDataFromNonce:async function(e,t){e=s(e,16),t=s(t,32);const[n,a,o]=await Promise.all([u(r.concat([t,e])),u(r.concat([e,t])),u(r.concat([t,t]))]);return{key:r.concat([n,a.slice(0,12)]),iv:r.concat([a.slice(12,20),o,t.slice(0,4)])}},sha1:u,sha256:function(e){const t=o.createHash("sha256");return t.update(e),t.digest()},bigIntMod:function(e,t){return e.remainder(t).add(t).remainder(t)},modExp:function(e,t,n){e=e.remainder(n);let r=a.one,o=e;for(;t.greater(a.zero);){const e=t.remainder(a(2));t=t.divide(a(2)),e.eq(a.one)&&(r=r.multiply(o),r=r.remainder(n)),o=o.multiply(o),o=o.remainder(n)}return r},getRandomInt:function(e,t){return e=Math.ceil(e),t=Math.floor(t),Math.floor(Math.random()*(t-e+1))+e},sleep:e=>new Promise((t=>{setTimeout(t,e)})),getByteArray:function(e,t=!1){const n=e.toString(2).length,r=Math.floor((n+8-1)/8);return l(a(e),r,!1,t)},toSignedLittleBuffer:s,convertToLittle:function(e){const t=r.alloc(4*e.length);for(let n=0;n<e.length;n++)t.writeUInt32BE(e[n],4*n);return t},bufferXor:function(e,t){const n=[];for(let r=0;r<e.length;r++)n.push(e[r]^t[r]);return r.from(n)}}},74121:(e,t,n)=>{"use strict";function r(e){const t=new Uint8Array(4*e.length);let n=0;for(let r=0;r<e.length;r++){const a=e[r];t[n++]=a>>>24,t[n++]=a>>16&255,t[n++]=a>>8&255,t[n++]=255&a}return t.buffer}function a(e){return e.buffer}function o(e){const t=new Uint8Array(e),n=new Uint32Array(t.length/4);for(let e=0;e<t.length;e+=4)n[e/4]=t[e]<<24^t[e+1]<<16^t[e+2]<<8^t[e+3];return n}function i(e){return new Uint32Array(e)}n.r(t),n.d(t,{ab2i:()=>c,ab2iBig:()=>i,ab2iLow:()=>o,i2ab:()=>l,i2abBig:()=>a,i2abLow:()=>r,isBigEndian:()=>s});const s=1===new Uint8Array(new Uint32Array([16909060]))[0],l=s?a:r,c=s?i:o},66842:(e,t,n)=>{var r=n(48764).Buffer;const a=n(28136).default,{i2ab:o,ab2i:i}=n(74121),{getWords:s}=n(77760);class l{constructor(e){this.setBytes(e)}setBytes(e){e=r.from(e),this._counter=e}increment(){for(let e=15;e>=0;e--){if(255!==this._counter[e]){this._counter[e]++;break}this._counter[e]=0}}}class c{constructor(e,t){t instanceof l||(t=new l(t)),this._counter=t,this._remainingCounter=void 0,this._remainingCounterIndex=16,this._aes=new a(s(e))}update(e){return this.encrypt(e)}encrypt(e){const t=r.from(e);for(let e=0;e<t.length;e++)16===this._remainingCounterIndex&&(this._remainingCounter=r.from(o(this._aes.encrypt(i(this._counter._counter)))),this._remainingCounterIndex=0,this._counter.increment()),t[e]^=this._remainingCounter[this._remainingCounterIndex++];return t}}class u{constructor(e){this.algorithm=e}update(e){this.data=new Uint8Array(e)}async digest(){return"sha1"===this.algorithm?r.from(await self.crypto.subtle.digest("SHA-1",this.data)):"sha256"===this.algorithm?r.from(await self.crypto.subtle.digest("SHA-256",this.data)):void 0}}e.exports={createCipheriv:function(e,t,n){if(e.includes("ECB"))throw new Error("Not supported");return new c(t,n)},createDecipheriv:function(e,t,n){if(e.includes("ECB"))throw new Error("Not supported");return new c(t,n)},randomBytes:function(e){const t=new Uint8Array(e);return crypto.getRandomValues(t),t},createHash:function(e){return new u(e)},pbkdf2:async function(e,t,n){const a=await crypto.subtle.importKey("raw",e,{name:"PBKDF2"},!1,["deriveBits"]);return r.from(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-512",salt:t,iterations:n},a,512))}}},77760:(e,t,n)=>{"use strict";function r(e,t){return e.charCodeAt(t)<<24^e.charCodeAt(t+1)<<16^e.charCodeAt(t+2)<<8^e.charCodeAt(t+3)}function a(e){if(e instanceof Uint32Array)return e;if("string"==typeof e){if(e.length%4!=0)for(let t=e.length%4;t<=4;t++)e+="\0x00";const t=new Uint32Array(e.length/4);for(let n=0;n<e.length;n+=4)t[n/4]=r(e,n);return t}if(e instanceof Uint8Array){const t=new Uint32Array(e.length/4);for(let n=0;n<e.length;n+=4)t[n/4]=e[n]<<24^e[n+1]<<16^e[n+2]<<8^e[n+3];return t}throw new Error("Unable to create 32-bit words")}function o(e,t,n=e){for(let r=0;r<e.length;r++)n[r]=e[r]^t[r]}n.r(t),n.d(t,{getWords:()=>a,s2i:()=>r,xor:()=>o})},98069:(e,t,n)=>{"use strict";n.d(t,{In:()=>o,l_:()=>a,wT:()=>i});let r=0;function a(){r+=1}function o(){r-=1}function i(){return r>0}},3858:(e,t,n)=>{"use strict";n.d(t,{Z:()=>r});const r=e=>{e.stopPropagation(),e.preventDefault()}}}]);
//# sourceMappingURL=3041.7ac910dba0029b3867fc.js.map