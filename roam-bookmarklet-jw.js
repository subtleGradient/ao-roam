// Bookmarklet tools

// import { $, $$, removeChild } from "./lib/dom.js"

/** @type {Document['querySelector']} */
// @ts-ignore
export const $ = (selectors) => document.querySelector(selectors)

/** @type {Document['querySelectorAll']} */
// @ts-ignore
export const $$ = (selectors) => document.querySelectorAll(selectors)

/**
 * @param {Element} node
 */
export const removeChild = node => node.parentElement?.removeChild(node)


// javascript:import("http://work-aylott-win.local:5000/bookmarklet-tools.js").then(module=>console.log(module))
// javascript:void(import("/bookmarklet-tools.js").then(({default:init})=>init()))
// javascript:import(`https://8eab5bddf934.ngrok.io/roam-bookmarklet-jw.js?_=${Date.now().toString(36)}`).then(({default:init})=>init())


export default function main() {
  const { href, hostname } = location

  $$('ao-modal-wrapper').forEach(removeChild)
  const modalWrap = document.createElement('ao-modal-wrapper')
  modalWrap.innerHTML = `
    <ao-modal 
      id="ao-modal"
      contentEditable
      autoFocus
      style="
        padding: 10hv;
        background: lime;
        position: fixed;
        height: 100vh;
        top:0;right:0;bottom:0;left:0;
        z-index: 999;
        overflow-y: auto;
      ">
    </ao-modal>
  `
  modalWrap.onclick = () => removeChild(modalWrap)
  document.body.appendChild(modalWrap)
  const modal = /** @type {HTMLElement} */(/** @type {any} */ (modalWrap.firstElementChild ?? modalWrap))
  setTimeout(() => { modal.focus() }, 0)

  console.log({ href, hostname, modalWrap });

  $$('article').forEach(article => {
    console.log(article)
    modal.innerHTML = article.outerHTML
  })
}


