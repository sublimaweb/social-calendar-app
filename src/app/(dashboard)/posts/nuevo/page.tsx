import { createClient } from '@/lib/supabase/server'
import PostForm from '@/components/posts/PostForm'
import type { TipoContenido } from '@/types'

interface Props {
  searchParams: Record<string, string>
}

export default async function NuevoPostPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cuentas } = await supabase
    .from('cuentas')
    .select('*')
    .eq('user_id', user!.id)
    .eq('activa', true)
    .order('nombre')

  const defaultValues = {
    cuenta_id: searchParams.cuenta_id,
    tipo_contenido: searchParams.tipo_contenido as TipoContenido | undefined,
    prompt_visual: searchParams.prompt_visual,
    descripcion: searchParams.descripcion,
    hashtags: searchParams.hashtags ? searchParams.hashtags.split(' ').filter(Boolean) : undefined,
    nota_recomendacion: searchParams.nota_recomendacion,
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo post</h1>
        <p className="text-gray-500 text-sm">
          {searchParams.cuenta_id ? '📋 Desde plantilla' : 'Agrega una nueva publicación al calendario'}
        </p>
      </div>
      <PostForm cuentas={cuentas ?? []} defaultValues={defaultValues} />
    </div>
  )
}
