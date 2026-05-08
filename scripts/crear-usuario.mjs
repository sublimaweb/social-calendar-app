import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://csycclykkfbymnxudfqq.supabase.co',
  'sb_publishable_NwN53Kd2NusYG0OYV_Ik7Q_gxrLoDH8'
)

const { data, error } = await supabase.auth.signUp({
  email: 'jeisonct@hotmail.com',
  password: '21099170Mateo*',
})

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('Usuario creado:', data.user?.email)
  console.log('ID:', data.user?.id)
  if (data.session) {
    console.log('✅ Sesión activa — puedes ingresar directamente')
  } else {
    console.log('📧 Revisa tu email para confirmar la cuenta (o desactiva confirmación en Supabase)')
  }
}
