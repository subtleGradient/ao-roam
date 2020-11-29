import { html, render } from 'https://unpkg.com/htm/preact/index.mjs?module'
import { useState, useEffect, useRef } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';

/**
 * @param {string} selectors
 * @param {HTMLElement | Document} parent
 * @return {HTMLElement[]}
 */
// @ts-ignore
const $$ = (selectors, parent = document) => [...parent.querySelectorAll(selectors)]

/**
 * @param {Element} node
 */
export const parentRemoveChild = node => node.parentElement?.removeChild(node)

/**
 * @param {HTMLElement} node
 */
export const selectTextOf = (node) => {
  // Clear any current selection
  const selection = window.getSelection();
  if (!selection) return
  selection.removeAllRanges();

  // Select
  const range = document.createRange();
  range.selectNodeContents(node)
  selection.addRange(range);
}

// javascript:import("http://work-aylott-win.local:5000/bookmarklet-tools.js").then(module=>console.log(module))
// javascript:void(import("/bookmarklet-tools.js").then(({default:init})=>init()))
// javascript:import(`https://8eab5bddf934.ngrok.io/roam-bookmarklet-jw.js?_=${Date.now().toString(36)}`).then(({default:init})=>init())


export default function main() {
  // const { href, hostname } = location

  $$('ao-modal-wrapper').forEach(parentRemoveChild)
  const modalWrap = document.createElement('ao-modal-wrapper')
  modalWrap.onclick = () => parentRemoveChild(modalWrap)
  document.body.appendChild(modalWrap)
  render(html`<${App} document=${document} />`, modalWrap)
}

/** @param {{ document: Document }} props */
function App({ document }) {
  const modal = useRef()
  useEffect(() => {
    modal.current.focus()
  }, [])
  const articles = $$('article')
  return html`
  <div ref=${modal} onFocus=${() => selectTextOf(modal.current)} autoFocus contentEditable
    style=${{ zIndex: 999, position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}>
    ${articles.map((article, index) => html`
    <${Thing} key=${index} article=${article} />
    `)}
  </div>
`
}

/** @param {{ article: HTMLElement }} props */
function Thing({ article }) {
  const questions = $$('p.qu', article)
  return (
    html`
    <ul>
      ${questions.map((q, index) => html`<li key=${index}>${q.textContent}</li>`)}
    </ul>
    `
  )
}
