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

// Soft warning threshold — a photo smaller than this on either axis may look fuzzy on the
// Print Flyer size. Informational only; never blocks (PRD risk mitigation).
export const LOW_RES_AXIS_PX = 1000

export function isLowRes(naturalWidth, naturalHeight, threshold = LOW_RES_AXIS_PX) {
  if (!naturalWidth || !naturalHeight) return false
  return naturalWidth < threshold || naturalHeight < threshold
}
