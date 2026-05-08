import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PostForm from '@/components/posts/PostForm'

export default async function EditarPostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: post }, { data: cuentas }] = await Promise.all([
    supabase.from('posts').select('*, cuenta:cuentas(*)').eq('id', params.id).single(),
    supabase.from('cuentas').select('*').eq('user_id', user!.id).eq('activa', true).order('nombre'),
  ])

  if (!post) notFound()

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar post</h1>
        <p className="text-gray-500 text-sm">{post.titulo}</p>
      </div>
      <PostForm post={post} cuentas={cuentas ?? []} />
    </div>
  )
}
