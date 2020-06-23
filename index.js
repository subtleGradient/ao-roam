console.debug("executing ao-roam index DEV")

const nao = Date.now()

/**
 * @param {string} query
 * @param {?(number|string)} arg1
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

get.defaultProps = ":block/uid :db/id :node/title"

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

const uidFromElement = (/**@type {Element} */ element) =>
  element.id.split("-").reverse()[0] //id="block-input-F6uIztpC2xbzqDVDuu32IJReoeW2-body-outline-alyAURK40-0unKRxaGp"

const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const el = /**@type {Element}*/ (/**@type {any}*/ node)
        const uid = uidFromElement(el)
        const block = get(uid, ":block/refs", ":block/string")
        block?.[":block/refs"]?.forEach(ref => {
          const attrs = getAttrs(
            ref,
            ":node/title",
            ":block/string",
            ":edit/time",
          )
          if (!attrs) return
          const tag = get(ref, ":node/title", ":entity/attrs")

          console.group("Mutation for block", uid)
          console.log("Element added", el)
          console.log("block refs page", tag)
          console.log("whose attributes are", attrs)

          /**@type {import('./RoamTypes').RoamNode}*/
          const mutationHandlerCode = attrs["vivify/onMutation"]
          mutationHandlerCode &&
            executeBlock(mutationHandlerCode[":db/id"], {
              mutation,
              node,
              block,
              page: tag,
              attrs,
            })

          console.groupEnd()
        })
      })

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
}

const vivify = {
  q,
  get,
  roam_onInit,
}

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
