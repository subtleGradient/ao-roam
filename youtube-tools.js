import qs from "https://jspm.dev/qs"

/**
 * @param {string} selectors
 * @return {HTMLElement[]}
 */
// @ts-ignore
const $$ = selectors => [...document.querySelectorAll(selectors)]
const waitFor = (isReady = () => true, delay = 10) => {
  return new Promise(done => {
    const loop = () => {
      const result = isReady()
      if (result != null) {
        done(result)
      } else {
        setTimeout(loop, delay)
      }
    }
    loop()
  })
}
const timeout = (time = 100) => new Promise(done => setTimeout(done, time))
const nextFrame = () => new Promise(done => requestAnimationFrame(done))

/** @return {Promise<import("./YouTube").CueGroup[] | null>} */
export async function getTranscriptCueGroups(TIMEOUT = 5000) {
  const startTime = Date.now()
  while (getTranscript() == null) {
    clickOpenMenu()
    // await nextFrame()
    await timeout(100)
    clickOpenTranscript()
    await timeout(100)
    if (Date.now() - startTime > TIMEOUT) {
      return null
    }
  }
  return getTranscript()
}
/** @return {import("./YouTube").CueGroup[] | null} */
const getTranscript = () =>
  // @ts-ignore
  $$("ytd-transcript-renderer")[0]?.__data?.data?.body?.transcriptBodyRenderer
    ?.cueGroups ?? null

const clickOpenTranscript = () =>
  [...$$("ytd-menu-service-item-renderer")]
    .filter(it => it.textContent?.includes("Open transcript"))
    .map(b => b.click()).length > 0

const clickOpenMenu = () =>
  [...$$('[aria-label="More actions"]')].forEach(b => b.click())

export const getCurrentPageUid = () => qs.parse(location.search, { ignoreQueryPrefix: true }).v
