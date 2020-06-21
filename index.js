console.debug("executing ao-roam index")

export const nao = Date.now()

const { roamAlphaAPI } = window

/** @typedef {{ ":db/id":number }} RoamDBRef */
/** @typedef {{ ":block/refs":RoamDBRef[]; ":block/children":RoamDBRef[] }} RoamBlock */
/** @typedef {RoamBlock & { ":node/title":string }} RoamNode */

/**
 * @param {string} query
 * @param {Array<number|string>} args
 * @returns {[number][]}
 */
export const q = (query, ...args) => roamAlphaAPI.q(query, ...args)

/**
 * @param {string} query
 * @param {Array<number|string>} args
 * @returns {RoamNode}
 */
export const pull = (props, ...args) => roamAlphaAPI.pull(props, ...args)

export const getStuffThatRefsToId = id =>
  q("[:find ?e :in $ ?a :where [?e :block/refs ?a]]", id)

export const getIdForTitle = title =>
  q("[:find ?e :in $ ?a :where [?e :node/title ?a]]", title)[0][0]

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

// console.log(getIdForTitle("ao/js/roam/onInit"))

export const uidFromElement = (/**@type {Element} */ element) =>
  element.id.split("-").reverse()[0] //id="block-input-F6uIztpC2xbzqDVDuu32IJReoeW2-body-outline-alyAURK40-0unKRxaGp"
