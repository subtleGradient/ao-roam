console.debug("executing ao-roam index DEV")

const nao = Date.now()

/**
 * @param {string} query
 * @param {?(number|string)} arg1
 * @param {(number|string)[]} args
 * @returns {[number][]}
 */
const q = (query, arg1, ...args) =>
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
const get = (id, ...props) => {
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
  return PULL_DEPRECATED(`[${props.join(" ") || "*"}]`, dbid)
}

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

const forEachThingThatRefsTo = (
  /**@type {string} */ tagName,
  /**@type {(dbid:number)=>void} */ fn,
) => {
  for (const [uid] of getStuffThatRefsTo(tagName)) {
    const block = get(uid, ":block/children")
    if (!block) continue
    const { ":block/children": children = [] } = block
    const [{ ":db/id": dbid }] = children
    if (!dbid) continue
    fn(dbid)
  }
}

const executeEverythingThatRefsTo = (/**@type {string} */ tagName) => {
  forEachThingThatRefsTo(tagName, executeBlockById)
}

const executeBlockById = (/**@type {number} */ dbid) => {
  const block = get(dbid, ":block/string", ":block/uid")
  if (!block) return
  const { ":block/string": code, ":block/uid": uid } = block
  if (!code.includes(`\`\`\`javascript`)) return

  const [, js] = code.split(/[`]{3}(?:javascript\b)?/) || []
  // eslint-disable-next-line no-new-func
  requestAnimationFrame(() => {
    try {
      Function("vivify", "uid", "dbid", js)(vivify, uid, dbid)
    } catch (error) {
      console.error("code block at", getUrlToUid(uid), `threw`, error)
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
        get(uid)
          ?.[":block/refs"]?.map(ref => get(ref))
          .forEach(refKid => {
            console.log("mounted block refers to", refKid)

            // const entity_attrs = refKid?.[":entity/attrs"]?.map(attr =>
            //   attr
            //     ?.filter(attr => Array.isArray(attr[":value"]))
            //     .map(({ ":source": [, source], ":value": value }) => [
            //       source,
            //       value[1],
            //     ])
            //     // .filter(([source, value]) => source != value)
            //     .map(([source, value]) => [
            //       get(source, ":node/title", ":block/string"),
            //       get(value, ":node/title", ":block/string"),
            //     ]),
            // )

            const entity_attrs = refKid?.[":entity/attrs"]?.map(
              ([page, attr, value]) => {
                const pageNode = attrToValue(page[":value"], ":node/title", ":block/string")
                const attrNode = attrToValue(attr[":value"], ":node/title", ":block/string")
                const valueNode = attrToValue(value[":value"], ":node/title", ":block/string")

                return { pageNode, attrNode, valueNode }
              },
            )
            console.log("and that page has these attributes", entity_attrs)
          })
      })

      // mutation.removedNodes
      // } else if (mutation.type === "attributes") {
      // console.log("The " + mutation.attributeName + " attribute was modified.")
    }
  }
})

/**
 * @param {string | import("./RoamTypes").RoamAttrItem} attr
 * @param { (keyof import('./RoamTypes').RoamNode)[] } props
 */
const attrToValue = (attr, ...props) =>
  Array.isArray(attr) && attr[0] === ":block/uid"
    ? get(attr[1], ...props)
    : attr

const roam_onInit = () => {
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
  q1,
  pull: PULL_DEPRECATED,
  get,
  getStuffThatRefsToId,
  getIdForTitle,
  getParentId,
  getIdFromUid,
  getCurrentPageUid,
  getCurrentPage,
  getStuffThatRefsTo,
  getUrlToUid,
  forEachThingThatRefsTo,
  executeEverythingThatRefsTo,
  executeBlockById,
  uidFromElement,
  roam_onInit,
}

export {
  q,
  q1,
  PULL_DEPRECATED as pull,
  get,
  getStuffThatRefsToId,
  getIdForTitle,
  getParentId,
  getIdFromUid,
  getCurrentPageUid,
  getCurrentPage,
  getStuffThatRefsTo,
  getUrlToUid,
  forEachThingThatRefsTo,
  executeEverythingThatRefsTo,
  executeBlockById,
  uidFromElement,
  roam_onInit,
}

export default vivify
