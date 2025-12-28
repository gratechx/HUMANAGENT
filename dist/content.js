console.log("🚀 Comet-X Content Script loaded");chrome.runtime.onMessage.addListener((n,l,r)=>{var t;switch(n.type){case"GET_SELECTION":r({text:((t=window.getSelection())==null?void 0:t.toString())||""});break;case"GET_PAGE_CONTENT":r(C());break;case"HIGHLIGHT_TEXT":f(n.payload.text),r({success:!0});break;default:r({error:"Unknown message type"})}return!0});function C(){var a,c;const n=document.title,l=window.location.href,r=["main","article",'[role="main"]',".content","#content",".post-content"];let t="";for(const e of r){const o=document.querySelector(e);if(o){t=o.textContent||"";break}}t||(t=document.body.innerText),t=t.replace(/\s+/g," ").trim().slice(0,15e3);const i=e=>{var o;return((o=document.querySelector(`meta[name="${e}"], meta[property="${e}"]`))==null?void 0:o.getAttribute("content"))||""};return{url:l,title:n,content:t,selectedText:((a=window.getSelection())==null?void 0:a.toString())||"",metadata:{description:i("description")||i("og:description"),author:i("author"),keywords:(c=i("keywords"))==null?void 0:c.split(",").map(e=>e.trim()),image:i("og:image")}}}function f(n){var a;if(!n)return;document.querySelectorAll(".comet-x-highlight").forEach(c=>{const e=c.parentNode;e&&(e.replaceChild(document.createTextNode(c.textContent||""),c),e.normalize())});const l=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null),r=[];let t;for(;t=l.nextNode();)(a=t.textContent)!=null&&a.toLowerCase().includes(n.toLowerCase())&&r.push(t);r.forEach(c=>{var h;const e=c.textContent||"",o=e.toLowerCase().indexOf(n.toLowerCase());if(o===-1)return;const m=e.slice(0,o),p=e.slice(o,o+n.length),u=e.slice(o+n.length),s=document.createElement("mark");s.className="comet-x-highlight",s.textContent=p;const d=document.createDocumentFragment();m&&d.appendChild(document.createTextNode(m)),d.appendChild(s),u&&d.appendChild(document.createTextNode(u)),(h=c.parentNode)==null||h.replaceChild(d,c)});const i=document.querySelector(".comet-x-highlight");i==null||i.scrollIntoView({behavior:"smooth",block:"center"})}const g=document.createElement("style");g.textContent=`
  .comet-x-highlight {
    background: linear-gradient(120deg, rgba(88, 166, 255, 0.3) 0%, rgba(88, 166, 255, 0.5) 100%);
    border-radius: 2px;
    padding: 0.1em 0.2em;
    animation: comet-x-pulse 2s ease-in-out infinite;
  }
  
  @keyframes comet-x-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;document.head.appendChild(g);
