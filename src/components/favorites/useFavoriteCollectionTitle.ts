import { useStore } from '../../store'
import { ALL_FAVORITES_COLLECTION_ID, DEFAULT_FAVORITE_COLLECTION_NAME } from '../../lib/favoriteState'
import { t, useUiLang } from '../../lib/i18n'

export function useFavoriteCollectionTitle() {
  useUiLang()
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const collections = useStore((s) => s.favoriteCollections)
  if (!activeFavoriteCollectionId) return ''
  if (activeFavoriteCollectionId === ALL_FAVORITES_COLLECTION_ID) return t('statusAll')
  return collections.find((collection) => collection.id === activeFavoriteCollectionId)?.name ?? DEFAULT_FAVORITE_COLLECTION_NAME
}
