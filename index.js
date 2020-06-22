console.debug("executing ao-roam index")

export const nao = Date.now()

/**
 * @param {string} query
 * @param {Array<number|string>} args
 * @returns {[number][]}
 */
export const q = (query, ...args) => window["roamAlphaAPI"].q(query, ...args)

/** @typedef { import('./RoamTypes').RoamNode } RoamNode */

/**
 * @param {string} props
 * @param {Array<number|string>} args
 * @returns {?RoamNode}
 */
export const pull = (props, ...args) =>
  window["roamAlphaAPI"].pull(props, ...args)

export const getStuffThatRefsToId = id =>
  q("[:find ?e :in $ ?a :where [?e :block/refs ?a]]", id)

export const getIdForTitle = title =>
  q("[:find ?e :in $ ?a :where [?e :node/title ?a]]", title)[0][0]

export const getParentId = id =>
  q("[:find ?e :in $ ?a :where [?e :block/children ?a]]", id)[0][0]

export const getCurrentPageUid = () =>
  window.location.hash.split("/").reverse()[0]

export const getCurrentPage = () =>
  pull(
    "[*]",
    q(
      "[:find ?e :in $ ?a :where [?e :block/uid ?a]]",
      getCurrentPageUid(),
    )[0][0],
  )

export const getStuffThatRefsTo = title =>
  getStuffThatRefsToId(getIdForTitle(title))

export const uidFromElement = (/**@type {Element} */ element) =>
  element.id.split("-").reverse()[0] //id="block-input-F6uIztpC2xbzqDVDuu32IJReoeW2-body-outline-alyAURK40-0unKRxaGp"

export const getUrlToUid = uid =>
  window.location.toString().replace(getCurrentPageUid(), uid)

export const forEachThingThatRefsTo = (tagName, fn) => {
  for (const [uid] of getStuffThatRefsTo(tagName)) {
    const block = pull("[:block/children]", uid)
    if (!block) continue
    const { ":block/children": children = [] } = block
    const [{ ":db/id": dbid }] = children
    if (!dbid) continue
    fn(dbid)
  }
}

export const executeEverythingThatRefsTo = tagName => {
  forEachThingThatRefsTo(tagName, executeBlockById)
}

export const executeBlockById = dbid => {
  const { ":block/string": code, ":block/uid": uid } = pull(
    "[:block/string :block/uid]",
    dbid,
  )
  if (!code.includes(`\`\`\`javascript`)) return

  const [, js] = code.split(/[`]{3}(?:javascript\b)?/) || []
  // eslint-disable-next-line no-new-func
  const fn = Function("uid", "dbid", js)
  requestAnimationFrame(() => {
    try {
      fn(uid, dbid)
    } catch (error) {
      console.error("code block at", getUrlToUid(uid), `threw`, error)
    }
  })
}

const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      // console.log("A child node has been added or removed.")
      // mutation.addedNodes[0]
      // mutation.removedNodes
      // } else if (mutation.type === "attributes") {
      // console.log("The " + mutation.attributeName + " attribute was modified.")
    }
  }
})

export const roam_onInit = () => {
  if (!window["roamAlphaAPI"]) {
    setTimeout(roam_onInit, 100)
    return
  }
  executeEverythingThatRefsTo("ao/js/roam/onInit")

  // observer.observe(document.documentElement, {
  //   attributes: true,
  //   childList: true,
  //   subtree: true
  // });

  // Later, you can stop observing
  // observer.disconnect();
}
