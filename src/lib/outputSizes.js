// Output sizes — use these constants everywhere. Do not hardcode pixel values
// outside this object. Labels are human-readable; never show raw pixels in UI.
export const OUTPUT_SIZES = {
  instagram_post:  { label: 'Instagram Post',  width: 1080, height: 1080 },
  instagram_story: { label: 'Instagram Story', width: 1080, height: 1920 },
  facebook_post:   { label: 'Facebook Post',   width: 1200, height: 630  },
  print_letter:    { label: 'Print Flyer',     width: 2550, height: 3300 },
}

export const DEFAULT_OUTPUT_SIZE = 'instagram_post'
