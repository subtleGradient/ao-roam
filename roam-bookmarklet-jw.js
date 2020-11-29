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
  // modalWrap.onclick = () => parentRemoveChild(modalWrap)
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
    style=${{ zIndex: 999, position: 'fixed', overflowY: 'auto', top: 0, right: 0, bottom: 0, left: 0, background: 'white', padding: '10vw', boxSizing: 'border-box' }}>
    <${Things} things=${articles} Thing=${Article} />
  </div>
`
}
// <${Header} article=${article} />
// <${Questions} article=${article} />

/** @param {{ thing: HTMLElement }} props */
function Article({ thing: article }) {
  const sections = $$('.section', article)
  return (
    html`
    <article>
      <${Header} article=${article} />
      <${Things} things=${sections} Thing=${Section} />
    </article>
    `
  )
}

/** @param {{ children: HTMLElement | string }} props */
const SpanThing = ({ children }) => html`<p>${clean(children.textContent?.toString() ?? children?.toString())}</p>`;

/** @param {{ children: HTMLElement }} props */
const Paragraph = ({ children }) => html`<${Things} things=${clean(children.textContent?.toString() ?? children?.toString())?.replace(/\.\s\.\s\.(?!\s\.)/g, '…'
  ).replace(/([.?!)]”?)\s(?![()…0-9])|—/g, '$1;;;').split(';;;')} />`;

/** @param {{ children: HTMLElement }} props */
function Section({ children: section }) {
  const [heading] = $$('h1,h2,h3,h4,h5', section)
  const questions = $$('p.qu', section)
  return (
    html`
    <section>
      <h2>${heading ? clean(heading.textContent) : "INTRO"}</h2>
      <${Things} things=${questions} Thing=${({ children: q }) => html`
        <h3>${clean(q.textContent)}</h3>
        <${Things} things=${$$(`[data-rel-pid="[${q.dataset.pid}]" ]`, section)} Thing=${Paragraph} />
    
        `} />
    </section>
    `
  )
}

/*
<${Things} things=${$$(`figure`, section)} Thing=${({ children: figure })=> {
          console.log({ section, figure })
            return (html`
          <div class="Section-figure">
            <h4 children=${$$(`figcaption p`, figure)[0]?.textContent} />
            <ul>
              <li><img src=${$$(`img`, figure)[0]?.src} /></li>
              <li>
                <${Paragraph} children=${$$(`img`, figure)[0]?.alt} />
              </li>
            </ul>
          </div>
          `);
            }} /> */

/** @param {{ article: HTMLElement }} props */
function Header({ article }) {
  const [contextTtl] = $$('header .contextTtl', article)
  const [h1] = $$('h1', article)
  const href = document.location.href.split('#')[0];
  return (
    html`
    <h1>
      <a href=${href}>(wol)</a>
      <img src=${`${href}/thumbnail`} width=75 height=75 />
      [[
      ${clean(contextTtl.textContent)}
      ${" "}
      ${clean(h1.textContent)}
      ]]
    </h1>
    `
  )
}

/**
 * @param {string | null} text
 */
const clean = (text) => text?.trim().replace(/\s+/, ' ')

// /** @param {{ article: HTMLElement }} props */
// function Questions({ article }) {
//   const questions = $$('p.qu', article)
//   return (
//     html`
//     <ul>
//       ${questions.map((q, index) => html`
//       <${QuestionAnd} key=${index} question=${q} />`)}
//     </ul>
//     `
//   )
// }

// /** @param {{ question: HTMLElement }} props */
// function QuestionAnd({ question }) {
//   const paragraphs = $$('p.qu', question)
//   return (
//     html`
//     <li>
//       <p>${question.textContent}</p>
//       <ul>
//         ${paragraphs.map((q, index) => html`<li key=${index}>${q.textContent}</li>`)}
//       </ul>
//     </li>
//     `
//   )
// }

/** @param {{
 *   things: any[],
 *   Thing: function | string
 * }} props */
function Things({ things, Thing = 'span' }) {
  return (
    html`
    <ul class="Things">
      ${things.map((thing, index) => html`
      <li key=${index} class=${`Things-${index}`}>
        <${Thing} key=${index} children=${thing} />
      </li>
      `)}
    </ul>
    `
  )
}
