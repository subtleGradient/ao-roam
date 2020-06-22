console.debug("executing ao-roam index")

export const nao = Date.now()

/** @typedef {{ ":db/id":number }} RoamDBRef */
/** @typedef {RoamDBRef & { ":block/uid":string; ":block/refs":RoamDBRef[]; ":block/children":RoamDBRef[]; ":block/string":string; ":block/open":boolean; ":block/order":number }} RoamBlock */
/** @typedef {RoamBlock & { ":node/title":string }} RoamNode */

/**
 * @param {string} query
 * @param {Array<number|string>} args
 * @returns {[number][]}
 */
export const q = (query, ...args) => window.roamAlphaAPI.q(query, ...args)

/**
 * @param {string} query
 * @param {Array<number|string>} args
 * @returns {null | RoamNode}
 */
export const pull = (props, ...args) => window.roamAlphaAPI.pull(props, ...args)

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

const onInitTagName = "ao/js/roam/onInit"

export const roam_onInit = () => {
  if (!window.roamAlphaAPI) {
    setTimeout(roam_onInit, 100)
    return
  }
  for (const [uid] of getStuffThatRefsTo(onInitTagName)) {
    const block = pull("[:block/children]", uid)
    if (!block) continue
    const { ":block/children": children = [] } = block
    const [{ ":db/id": dbid }] = children
    if (!dbid) continue
    {
      const { ":block/string": code, ":block/uid": uid } = pull(
        "[:block/string :block/uid]",
        dbid,
      )
      if (!code.includes(`\`\`\`javascript`)) continue

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
  }
}
