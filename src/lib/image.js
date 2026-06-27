// Load a user-picked image File into an HTMLImageElement (+ data URL) for Konva.
// Resolves with natural dimensions so we can warn on low-resolution photos.
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('not-an-image'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read-failed'))
    reader.onload = () => {
      const src = reader.result
      const image = new Image()
      image.onload = () =>
        resolve({
          src,
          image,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        })
      image.onerror = () => reject(new Error('decode-failed'))
      image.src = src
    }
    reader.readAsDataURL(file)
  })
}

// Build a photo object from an already-resolved image src (a data URL). Used when restoring a
// saved flyer (M7b): the original bytes come back from R2, are turned into a data URL, then
// decoded here. A data URL is same-origin → the canvas never taints → export stays clean.
export function loadImageSrc(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({ src, image, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })
    image.onerror = () => reject(new Error('decode-failed'))
    image.src = src
  })
}

// Blob → data URL (for R2-served photo bytes; data URLs avoid any canvas-taint on export).
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read-failed'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

// Soft warning threshold — a photo smaller than this on either axis may look fuzzy on the
// Print Flyer size. Informational only; never blocks (PRD risk mitigation).
export const LOW_RES_AXIS_PX = 1000

export function isLowRes(naturalWidth, naturalHeight, threshold = LOW_RES_AXIS_PX) {
  if (!naturalWidth || !naturalHeight) return false
  return naturalWidth < threshold || naturalHeight < threshold
}
