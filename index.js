console.debug("executing ao-roam index")

export const nao = Date.now()

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
 * @param {?(number|string)} arg1
 * @param {(number|string)[]} args
 * @returns {?number}
 */
export const q1 = (query, arg1, ...args) => {
  const result1 = q(query, arg1, ...args)[0]
  if (!Array.isArray(result1)) return null
  return result1[0]
}

/**
 * @param {string} props
 * @param {?number} dbid
 * @returns {import('./RoamTypes').RoamNode | import('./RoamTypes').RoamBlock | null | undefined}
 */
export const pull = (props, dbid) =>
  dbid == null
    ? null
    : window.roamAlphaAPI && window.roamAlphaAPI.pull(props, dbid)

export const getStuffThatRefsToId = (/**@type {?number} */ dbid) =>
  q("[:find ?e :in $ ?a :where [?e :block/refs ?a]]", dbid)

export const getIdForTitle = (/**@type {?string} */ title) =>
  q1("[:find ?e :in $ ?a :where [?e :node/title ?a]]", title)

export const getParentId = (/**@type {?number} */ dbid) =>
  q1("[:find ?e :in $ ?a :where [?e :block/children ?a]]", dbid)

export const getIdFromUid = (/**@type {?string} */ uid) =>
  q1("[:find ?e :in $ ?a :where [?e :block/uid ?a]]", uid)

export const getCurrentPageUid = () =>
  window.location.hash.split("/").reverse()[0]

export const getCurrentPage = () =>
  pull("[*]", getIdFromUid(getCurrentPageUid()))

export const getStuffThatRefsTo = (/**@type {string} */ title) =>
  getStuffThatRefsToId(getIdForTitle(title))

export const getUrlToUid = (/**@type {string} */ uid) =>
  window.location.toString().replace(getCurrentPageUid(), uid)

export const forEachThingThatRefsTo = (
  /**@type {string} */ tagName,
  /**@type {(dbid:number)=>void} */ fn,
) => {
  for (const [uid] of getStuffThatRefsTo(tagName)) {
    const block = pull("[:block/children]", uid)
    if (!block) continue
    const { ":block/children": children = [] } = block
    const [{ ":db/id": dbid }] = children
    if (!dbid) continue
    fn(dbid)
  }
}

export const executeEverythingThatRefsTo = (/**@type {string} */ tagName) => {
  forEachThingThatRefsTo(tagName, executeBlockById)
}

export const executeBlockById = (/**@type {number} */ dbid) => {
  const block = pull("[:block/string :block/uid]", dbid)
  if (!block) return
  const { ":block/string": code, ":block/uid": uid } = block
  if (!code.includes(`\`\`\`javascript`)) return

  const [, js] = code.split(/[`]{3}(?:javascript\b)?/) || []
  // eslint-disable-next-line no-new-func
  requestAnimationFrame(() => {
    try {
      Function("uid", "dbid", js)(uid, dbid)
    } catch (error) {
      console.error("code block at", getUrlToUid(uid), `threw`, error)
    }
  })
}

export const uidFromElement = (/**@type {Element} */ element) =>
  element.id.split("-").reverse()[0] //id="block-input-F6uIztpC2xbzqDVDuu32IJReoeW2-body-outline-alyAURK40-0unKRxaGp"

const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const uid = uidFromElement(
            /**@type {Element}*/ (/**@type {any}*/ node),
          )
          if (!uid) return
          const block = pull("[*]", getIdFromUid(uid))
          console.log("mounted block", block)
        }
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

  // observer.observe(document.documentElement, {
  //   attributes: true,
  //   childList: true,
  //   subtree: true
  // });

  // Later, you can stop observing
  // observer.disconnect();
}
