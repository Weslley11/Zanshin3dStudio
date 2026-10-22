import { useQuery } from '@tanstack/react-query'
import { keys, must } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { CatalogItem } from '@/lib/types'

export function useCatalog() {
  return useQuery({
    queryKey: keys.catalog,
    queryFn: async () => must(await supabase.from('catalog_items').select('*').order('category').order('name')) as CatalogItem[],
  })
}
