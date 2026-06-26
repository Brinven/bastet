// The only valid values for `fieldBinding` in template JSON.
// Never invent new built-in IDs. Custom fields use the prefix `custom_`.
export const FIELDS = {
  ANIMAL_PHOTO:     'animal_photo',
  ANIMAL_NAME:      'animal_name',
  BIO:              'bio',
  BREED:            'breed',
  AGE:              'age',
  GENDER:           'gender',
  WEIGHT:           'weight',
  GOOD_WITH_KIDS:   'good_with_kids',
  GOOD_WITH_DOGS:   'good_with_dogs',
  GOOD_WITH_CATS:   'good_with_cats',
  GOOD_WITH_OTHER:  'good_with_other',
  SPAYED_NEUTERED:  'spayed_neutered',
  ADOPTION_FEE:     'adoption_fee',
  FOSTER_VS_ADOPT:  'foster_vs_adopt',
  RESCUE_NAME:      'rescue_name',
  RESCUE_LOGO:      'rescue_logo',
  RESCUE_PHONE:     'rescue_phone',
  RESCUE_WEBSITE:   'rescue_website',
  CONTACT_BLOCK:    'contact_block',
}

export const CUSTOM_FIELD_PREFIX = 'custom_'
