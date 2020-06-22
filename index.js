console.debug("executing ao-roam index")

export const nao = Date.now()

/**
 * @param {string} query
 * @param {(number|string)[]} args
 * @returns {[number][]}
 */
export const q = (query, ...args) =>
  (window.roamAlphaAPI && window.roamAlphaAPI.q(query, ...args)) || []

/**
 * @param {string} props
 * @param {number} dbid
 * @returns {import('./RoamTypes').RoamNode | import('./RoamTypes').RoamBlock | null | undefined}
 */
export const pull = (props, dbid) =>
  window.roamAlphaAPI && window.roamAlphaAPI.pull(props, dbid)

export const getStuffThatRefsToId = (/**@type {number} */ dbid) =>
  q("[:find ?e :in $ ?a :where [?e :block/refs ?a]]", dbid)

export const getIdForTitle = (/**@type {string} */ title) =>
  q("[:find ?e :in $ ?a :where [?e :node/title ?a]]", title)[0][0]

export const getParentId = (/**@type {number} */ dbid) =>
  q("[:find ?e :in $ ?a :where [?e :block/children ?a]]", dbid)[0][0]

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

export const getStuffThatRefsTo = (/**@type {string} */ title) =>
  getStuffThatRefsToId(getIdForTitle(title))

export const uidFromElement = (/**@type {Element} */ element) =>
  element.id.split("-").reverse()[0] //id="block-input-F6uIztpC2xbzqDVDuu32IJReoeW2-body-outline-alyAURK40-0unKRxaGp"

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
  if (!window.roamAlphaAPI) {
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
