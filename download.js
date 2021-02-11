/**
 * @param {string} fileName
 * @param {any} data
 */

export async function download(fileName, data) {
  const content =
    typeof data === "string" || data instanceof Blob
      ? data
      : JSON.stringify(data)
  const downloadURL = window.URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  )
  const anchor = document.createElement("a")
  anchor.download = fileName
  anchor.href = downloadURL
  await new Promise(resolve => setTimeout(resolve, 0))
  anchor.dispatchEvent(new MouseEvent("click"))
}
