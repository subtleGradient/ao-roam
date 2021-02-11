/**
 * Bookmarklet micro tool
 * Download the transcript of the current YouTube video as a CSV file
 *
 * Usage:
javascript:import("https://cdn.jsdelivr.net/gh/subtleGradient/ao-roam@master/youtube-dl-transcript-csv.ts.js").then(({main})=>main())

 * Dev usage:
javascript:import(`https://${`9d93fbf8f31e.ngrok.io`}/youtube-dl-transcript-csv.ts.js?_=${Date.now().toString(36)}`).then(({main})=>main())
 */
/*!
Copyright 2020 Thomas Aylott <oblivious@subtlegradient.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import stringify from "https://jspm.dev/csv-stringify/lib/sync"
import { download } from "./download.js"
import { getCurrentPageUid, getTranscriptCueGroups } from "./youtube-tools.js"

export async function main() {
  try {
    const cueGroups = await getTranscriptCueGroups()
    await download(
      `youtube-${getCurrentPageUid()}-cueGroups.json`,
      JSON.stringify(cueGroups),
    )
    await download(
      `youtube-${getCurrentPageUid()}-cueGroups.csv`,
      stringify([headers(cueGroups), ...getRows(cueGroups)]),
    )
  } catch (e) {
    console.error(e)
  }
}

/**
 * @param {import("./YouTube").CueGroup[] | null} cueGroups
 * @return {string[]}
 */
function headers(cueGroups) {
  return ["formattedStartOffset", "startOffset", "duration", "text", "duration/length"]
}

/**
 * @param {import("./YouTube").CueGroup[] | null} cueGroups
 * @return {(string|number)[][]}
 */
function getRows(cueGroups) {
  /** @type {(string | number)[][]} */
  const rows = []
  cueGroups?.forEach(cg => {
    if (cg.transcriptCueGroupRenderer.cues.length > 1) {
      console.warn(
        "ignoring additional cues",
        cg.transcriptCueGroupRenderer.cues,
      )
    }
    const [formattedStartOffset, startOffset, duration, text] = [
      cg.transcriptCueGroupRenderer.formattedStartOffset.simpleText,
      +cg.transcriptCueGroupRenderer.cues[0].transcriptCueRenderer
        .startOffsetMs,
      +cg.transcriptCueGroupRenderer.cues[0].transcriptCueRenderer.durationMs,
      cg.transcriptCueGroupRenderer.cues[0].transcriptCueRenderer.cue
        .simpleText,
    ]
    rows.push([
      formattedStartOffset,
      startOffset,
      duration,
      text,
      Math.round(duration / text?.length || 0),
    ])
  })
  return rows
}
