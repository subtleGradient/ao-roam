/** @type {Document['querySelector']} */
// @ts-ignore
export const $ = (selectors) => document.querySelector(selectors)

/** @type {Document['querySelectorAll']} */
// @ts-ignore
export const $$ = (selectors) => document.querySelectorAll(selectors)

/**
 * @param {Element} node
 */
export const removeChild = node => node.parentElement?.removeChild(node)
