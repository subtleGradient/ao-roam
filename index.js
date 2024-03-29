import { React, ReactDOM } from "https://jspm.dev/react@17"
import htm from "https://unpkg.com/htm?module"

console.log('hello')

const html = htm.bind(React.createElement)

/**
 * @param {{ count: string; }} props
 */
const Counter = props => {
  const [count, setCount] = React.useState(parseInt(props.count))
  return html`
    <div>
      <h1>${count}</h1>
      <button onClick=${_e => setCount(count - 1)}>Decrement</button>
      <button onClick=${_e => setCount(count + 1)}>Increment</button>
    </div>
  `
}

console.debug("executing ao-roam index DEV")

const nao = Date.now()

/**
 * @param {string} query
 * @param {number|string|null|undefined} arg1
 * @param {(number|string)[]} args
 * @returns {[number][]}
 */
export const q = (query, arg1, ...args) =>
  arg1 == null
    ? []
    : (window.roamAlphaAPI && window.roamAlphaAPI.q(query, arg1, ...args)) || []

/**
 * @param {string} query
 * @param {number|string|null|undefined} arg1
 * @param {(number|string)[]} args
 * @returns {?number}
 */
const q1 = (query, arg1, ...args) => {
  const result1 = q(query, arg1, ...args)[0]
  if (!Array.isArray(result1)) return null
  return result1[0]
}

/**
 * @deprecated
 * @param {string} props
 * @param {number | null | undefined} dbid
 */
const PULL_DEPRECATED = (props, dbid) =>
  dbid == null
    ? null
    : window.roamAlphaAPI && window.roamAlphaAPI.pull(props, dbid)

/**
 * get a node or block by its :db/id
 * @param { null | undefined | import('./RoamTypes').RoamId } id
 * @param { (keyof import('./RoamTypes').RoamNode)[] } props
 */
export const get = (id, ...props) => {
  if (id == null) return null
  let uid, dbid
  switch (typeof id) {
    case "object":
      ;({ ":block/uid": uid, ":db/id": dbid } = id)
      break
    case "string":
      uid = id
      break
    case "number":
      dbid = id
      break
  }
  if (dbid == null && uid != null) dbid = getIdFromUid(uid)
  if (dbid == null) return null
  const propString =
    props.length === 0 ? "[*]" : `[${props.join(" ")} ${get.defaultProps}]`
  return PULL_DEPRECATED(propString, dbid)
}

get.defaultProps = ":block/uid :db/id"

const getStuffThatRefsToId = (/**@type {?number} */ dbid) =>
  q("[:find ?e :in $ ?a :where [?e :block/refs ?a]]", dbid)

const getIdForTitle = (/**@type {?string} */ title) =>
  q1("[:find ?e :in $ ?a :where [?e :node/title ?a]]", title)

const getParentId = (/**@type {?number} */ dbid) =>
  q1("[:find ?e :in $ ?a :where [?e :block/children ?a]]", dbid)

const getIdFromUid = (/**@type {string | null | undefined} */ uid) =>
  q1("[:find ?e :in $ ?a :where [?e :block/uid ?a]]", uid)

const getCurrentPageUid = () => window.location.hash.split("/").reverse()[0]

const getCurrentPage = () => get(getCurrentPageUid())

const getStuffThatRefsTo = (/**@type {string} */ title) =>
  getStuffThatRefsToId(getIdForTitle(title))

const getUrlToUid = (/**@type {string} */ uid) =>
  window.location.toString().replace(getCurrentPageUid(), uid)

const forFirstChildOfEachThingThatRefsTo = (
  /**@type {string} */ tagName,
  /**@type {(dbid:number)=>void} */ fn,
) => {
  for (const [uid] of getStuffThatRefsTo(tagName)) {
    const firstChildId = get(uid, ":block/children")?.[":block/children"]?.[0][
      ":db/id"
    ]
    firstChildId && fn(firstChildId)
  }
}

const executeEverythingThatRefsTo = (/**@type {string} */ tagName) => {
  forFirstChildOfEachThingThatRefsTo(tagName, id =>
    executeBlock(id, {
      trigger: tagName,
    }),
  )
}

/**
 * @param {string | number | { ":block/uid"?: string; ":db/id"?: number; } | null | undefined} id
 * @param {{[key:string]:any}} extraArgs
 */
const executeBlock = (id, extraArgs = {}) => {
  const codeBlock = get(id, ":block/string", ":block/uid")
  if (!codeBlock) return
  const { ":block/string": code, ":block/uid": uid } = codeBlock
  if (!code.includes(`\`\`\`javascript`)) return
  const [, js] = code.split(/[`]{3}(?:javascript\b)?/) || []

  const args = { ...extraArgs, codeBlock }
  const argKeys = Object.keys(args)
  const argVals = Object.values(args)

  requestAnimationFrame(() => {
    try {
      // eslint-disable-next-line no-new-func
      Function("vivify", "args", ...argKeys, js)(vivify, args, ...argVals)
    } catch (error) {
      console.error("code block at", getUrlToUid(uid), `threw`, error)
      if (error instanceof SyntaxError) console.debug(js)
    }
  })
}

// -body-outline-
// -mentions-page-
const uidFromElement = (/**@type {Element} */ element) => {
  // const [, currentPageUID] = element.baseURI.split("/page/")
  // const [, blockUID] = element.id.split(`${currentPageUID}-`)
  // TODO: add support for [[embed]] e.g. block-input-uuid11c136f1-a9b5-4ff4-9760-13fcdd0189a3-TXupdk-W_
  return element.id.match(/-([a-zA-Z0-9_-]{9}|\d{2}-\d{2}-\d{4})$/)?.[1]
}

/**
 * @param {Node} node
 * @param {MutationRecord} mutation
 * @param {'added'|'removed'} action
 */
const handleNode = (action, node, mutation) => {
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = /**@type {Element}*/ (/**@type {any}*/ node)
  const uid = uidFromElement(el)
  const block = get(uid, ":block/refs", ":block/string")
  block?.[":block/refs"]?.forEach(ref => {
    const attrs = getAttrs(ref, ":node/title", ":block/string", ":edit/time")
    if (!attrs) return
    const tag = get(ref, ":node/title", ":entity/attrs")

    console.groupCollapsed("Mutation for block", uid)
    console.log("Element added", el)
    console.log("block refs page", tag)
    console.log("whose attributes are", attrs)

    /**@type {import('./RoamTypes').RoamNode}*/
    const mutationHandlerCode = attrs["vivify/onMutation"]
    mutationHandlerCode &&
      executeBlock(mutationHandlerCode[":db/id"], {
        action,
        mutation,
        node,
        block,
        page: tag,
        attrs,
      })

    console.groupEnd()
  })
}

const observer = new MutationObserver((mutationsList, _observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(node => handleNode("added", node, mutation))
      mutation.removedNodes.forEach(node =>
        handleNode("removed", node, mutation),
      )

      // mutation.removedNodes
      // } else if (mutation.type === "attributes") {
      // console.log("The " + mutation.attributeName + " attribute was modified.")
    }
  }
})

export const roam_onInit = () => {
  if (!window.roamAlphaAPI) {
    setTimeout(roam_onInit, 100)
    return
  }
  executeEverythingThatRefsTo("vivify/onInit")

  observer.observe(document.documentElement, {
    // attributes: true,
    childList: true,
    subtree: true,
  })

  // Later, you can stop observing
  // observer.disconnect();
  initRenderStuff()
}

function initRenderStuff() {
  const root =
    document.getElementsByTagName("vivify-root")[0] ||
    document.createElement("vivify-root")
  document.body.appendChild(root)

  ReactDOM.render(
    html`
      <h1>Look Ma! No script tags, no build step</h1>
      <${Counter} count=${0} />
    `,
    root,
  )
}

const vivify = {
  q,
  get,
  roam_onInit,
}

// @ts-ignore
window["vivify"] = vivify

/**
 * @param {string | number | { ":block/uid"?: string; ":db/id"?: number; } | null | undefined} id
 * @param { (keyof import('./RoamTypes').RoamNode)[] } props
 */
const getAttrs = (id, ...props) => {
  return get(id, ":entity/attrs")?.[":entity/attrs"]?.reduce((
    /**@type {any}*/ acc = {},
    [page, attr, value],
  ) => {
    const key = get(attr[":value"][1], ":node/title")?.[":node/title"] || "key"
    const val =
      typeof value[":value"] === "string"
        ? value[":value"]
        : get(value[":value"][1], ...props)

    if (key in acc) acc[key] = [acc[key], val].flat()
    else acc[key] = val
    return acc
  }, undefined)
}

/**
 * @param {TemplateStringsArray} template
 * @param {any[]} vals
 */
const esm = (template, ...vals) =>
  URL.createObjectURL(
    new Blob([String.raw(template, ...vals)], { type: "text/javascript" }),
  )

// esm`export const lulz = true`
