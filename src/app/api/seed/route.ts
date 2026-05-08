import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays, format } from 'date-fns'

const hoy = new Date()
const d = (offset: number) => format(addDays(hoy, offset), 'yyyy-MM-dd')

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const uid = user.id

  // ─── 1. Cuentas ──────────────────────────────────────────────────────────
  const cuentasData = [
    { user_id: uid, nombre: 'La Tienda',   red_social: 'Instagram', color: '#E1306C', activa: true },
    { user_id: uid, nombre: 'Contenidos',  red_social: 'TikTok',    color: '#010101', activa: true },
    { user_id: uid, nombre: 'Mi Empresa',  red_social: 'LinkedIn',  color: '#0A66C2', activa: true },
  ]
  const { data: cuentas, error: eCuentas } = await supabase
    .from('cuentas').insert(cuentasData).select()
  if (eCuentas || !cuentas) return NextResponse.json({ error: eCuentas?.message }, { status: 500 })

  const [ig, tt, li] = cuentas

  // ─── 2. Posts ─────────────────────────────────────────────────────────────
  const postsData = [
    // ── Instagram (La Tienda) ──────────────────────────────────────────────
    {
      user_id: uid, cuenta_id: ig.id,
      tipo_contenido: 'imagen', estado: 'pendiente', pilar: 'ventas',
      titulo: 'Lanzamiento colección primavera 🌸',
      fecha_publicacion: d(2), hora_aproximada: '10:00',
      descripcion: '¡Llegó la primavera a nuestra tienda! ✨ Descubre nuestra nueva colección con piezas únicas, colores vibrantes y telas naturales. Disponible online y en tienda física desde este viernes.\n\nEnvíos gratis en compras mayores a $50.000 🛍️',
      hashtags: ['#primavera2025', '#nuevacoleccion', '#moda', '#tiendaonline', '#estilo', '#fashionista', '#tendencias', '#ropa'],
      nota_recomendacion: 'Publicar el viernes temprano — mejor engagement en la mañana para esta cuenta.',
    },
    {
      user_id: uid, cuenta_id: ig.id,
      tipo_contenido: 'carrusel', estado: 'borrador', pilar: 'educativo',
      titulo: '5 tips para combinar colores 🎨',
      fecha_publicacion: d(5), hora_aproximada: '18:00',
      descripcion: '¿Sabías que el 62% de las personas elige ropa según el estado de ánimo? 🎨\n\nDesliza para aprender a combinar colores como una estilista:\n👉 Slide 1: La rueda de colores\n👉 Slide 2: Colores análogos vs complementarios\n👉 Slide 3: El truco del tono neutro\n👉 Slide 4: Errores frecuentes\n👉 Slide 5: Tu outfit del día',
      hashtags: ['#tips', '#moda', '#colores', '#estilismo', '#outfit', '#fashiontips', '#aprende'],
    },
    {
      user_id: uid, cuenta_id: ig.id,
      tipo_contenido: 'reel', estado: 'publicado', pilar: 'entretenimiento',
      titulo: 'Reel: Before & After outfit de oficina',
      fecha_publicacion: d(-3), hora_aproximada: '19:00',
      descripcion: 'De pijama a ejecutiva en 60 segundos ✨ ¿Cuál look es tu favorito? Comenta abajo 👇',
      hashtags: ['#reel', '#outfit', '#oficina', '#transformation', '#fyp', '#viral', '#moda'],
      publicado_en: addDays(hoy, -3).toISOString(),
    },

    // ── TikTok (Contenidos) ────────────────────────────────────────────────
    {
      user_id: uid, cuenta_id: tt.id,
      tipo_contenido: 'video', estado: 'en_revision', pilar: 'educativo',
      titulo: 'Tutorial: cómo editar reels en 2 minutos',
      fecha_publicacion: d(1), hora_aproximada: '20:00',
      descripcion: 'El truco que nadie te enseña para editar más rápido 🎬 Guárdalo para después 👆\n\n#tutorial #edición #contenido',
      hashtags: ['#tutorial', '#edicion', '#reels', '#contentcreator', '#tiktok', '#aprende', '#tips', '#social'],
      nota_recomendacion: 'En revisión con el equipo — esperar aprobación antes de programar.',
    },
    {
      user_id: uid, cuenta_id: tt.id,
      tipo_contenido: 'video', estado: 'pendiente', pilar: 'comunidad',
      titulo: 'POV: cuando llega el paquete que pediste 📦',
      fecha_publicacion: d(4), hora_aproximada: '21:00',
      descripcion: 'Ese momento de felicidad cuando rastreaste el paquete 47 veces 😂\n\n¿A cuántos les pasa? Comenten! 👇',
      hashtags: ['#pov', '#relatable', '#humor', '#compras', '#pakete', '#fyp', '#parati', '#viral'],
    },
    {
      user_id: uid, cuenta_id: tt.id,
      tipo_contenido: 'reel', estado: 'borrador', pilar: 'inspiracional',
      titulo: 'Story time: cómo empecé mi negocio con $0',
      fecha_publicacion: d(8),
      descripcion: 'Tenía 23 años, un celular y muchas ganas. Esto es lo que aprendí 💪\n\nParte 1 de 3.',
      hashtags: ['#emprendimiento', '#storytime', '#negocio', '#motivacion', '#emprendedor', '#exito', '#fyp'],
      nota_recomendacion: 'Hacer en serie — grabar las 3 partes antes de publicar la primera.',
    },

    // ── LinkedIn (Mi Empresa) ──────────────────────────────────────────────
    {
      user_id: uid, cuenta_id: li.id,
      tipo_contenido: 'texto', estado: 'aprobado', pilar: 'inspiracional',
      titulo: 'Reflexión: 3 lecciones de 2 años emprendiendo',
      fecha_publicacion: d(3), hora_aproximada: '09:00',
      descripcion: 'Hace 2 años renuncié a mi trabajo corporativo para emprender. Estas son las 3 lecciones más importantes que aprendí:\n\n1️⃣ El fracaso no es el final — es el feedback más honesto que recibirás.\n\n2️⃣ Tu red de contactos vale más que cualquier capital inicial.\n\n3️⃣ La consistencia supera al talento en el largo plazo.\n\n¿Cuál de estas resuena contigo? Me encantaría leer tu experiencia en los comentarios.',
      hashtags: ['#emprendimiento', '#liderazgo', '#aprendizaje', '#negocios', '#linkedin'],
      nota_recomendacion: 'Publicar martes a las 9am — mejor alcance para contenido reflexivo en LinkedIn.',
    },
    {
      user_id: uid, cuenta_id: li.id,
      tipo_contenido: 'imagen', estado: 'pendiente', pilar: 'ventas',
      titulo: 'Case study: +40% de ventas en 6 meses',
      fecha_publicacion: d(7), hora_aproximada: '10:30',
      descripcion: '¿Cómo pasamos de 80 a 112 clientes en 6 meses sin aumentar el presupuesto de marketing?\n\nEl secreto: segmentación de audiencia + contenido de valor + seguimiento sistemático.\n\nComparto el proceso completo en este post 👇',
      hashtags: ['#casestudy', '#ventas', '#marketing', '#b2b', '#resultados', '#estrategia'],
    },
    {
      user_id: uid, cuenta_id: li.id,
      tipo_contenido: 'texto', estado: 'borrador', pilar: 'educativo',
      titulo: '¿Por qué el contenido educativo convierte más?',
      fecha_publicacion: d(10), hora_aproximada: '08:00',
      descripcion: 'La mayoría de las empresas cometen este error: publican solo para vender.\n\nEl contenido que mejor convierte NO es el que dice "cómprame". Es el que enseña algo útil y posiciona tu marca como experta.\n\nRegla simple: 70% valor educativo / 20% comunidad / 10% venta directa.\n\n¿Tu empresa ya aplica esta fórmula?',
      hashtags: ['#contenido', '#marketing', '#educacion', '#estrategia', '#linkedin'],
    },
  ]

  const { error: ePosts } = await supabase.from('posts').insert(postsData)
  if (ePosts) return NextResponse.json({ error: ePosts.message }, { status: 500 })

  // ─── 3. Plantillas ───────────────────────────────────────────────────────
  const plantillasData = [
    {
      user_id: uid, cuenta_id: ig.id,
      nombre: 'Post de lanzamiento — Instagram',
      tipo_contenido: 'imagen',
      descripcion: '¡[PRODUCTO] ya está disponible! ✨\n\nDescubre [BENEFICIO PRINCIPAL]. Disponible en [CANALES].\n\n¿Ya lo conoces? Cuéntanos en los comentarios 👇',
      hashtags: ['#lanzamiento', '#nuevo', '#disponible', '#tienda', '#moda'],
      nota_recomendacion: 'Reemplazar los textos entre corchetes antes de publicar.',
    },
    {
      user_id: uid, cuenta_id: tt.id,
      nombre: 'Tutorial paso a paso — TikTok',
      tipo_contenido: 'video',
      descripcion: '¿Sabías que puedes [LOGRO] en solo [TIEMPO]? 🤯\n\nSigue estos pasos:\n✅ Paso 1: ...\n✅ Paso 2: ...\n✅ Paso 3: ...\n\nGuarda este video para cuando lo necesites 💾',
      hashtags: ['#tutorial', '#aprende', '#tips', '#fyp', '#parati'],
      nota_recomendacion: 'Grabar con buena iluminación. Duración ideal: 45-60 segundos.',
    },
    {
      user_id: uid, cuenta_id: li.id,
      nombre: 'Reflexión profesional — LinkedIn',
      tipo_contenido: 'texto',
      descripcion: '[HOOK impactante en 1 frase]\n\n[Historia o contexto en 2-3 párrafos]\n\nLa lección que aprendí:\n1️⃣ [Punto 1]\n2️⃣ [Punto 2]\n3️⃣ [Punto 3]\n\n¿Cuál de estos puntos te resuena más? Leo todos los comentarios.',
      hashtags: ['#linkedin', '#liderazgo', '#aprendizaje', '#emprendimiento'],
      nota_recomendacion: 'Publicar martes o miércoles entre 8-10am. Primer comentario propio a los 30 min.',
    },
  ]
  await supabase.from('plantillas').insert(plantillasData)

  // ─── 4. Notas rápidas ────────────────────────────────────────────────────
  const notasData = [
    {
      user_id: uid,
      contenido: '📊 Revisar métricas de Instagram cada lunes — alcance, guardados y visitas al perfil.',
      color: '#dbeafe',
    },
    {
      user_id: uid,
      contenido: '⏰ Mejor horario para TikTok: 8pm - 10pm. Para LinkedIn: martes y miércoles 9am.',
      color: '#dcfce7',
    },
    {
      user_id: uid,
      contenido: '💡 Ideas próximo mes: contenido de verano, sorteo aniversario, collab con otra cuenta del nicho.',
      color: '#fef9c3',
    },
  ]
  await supabase.from('notas').insert(notasData)

  return NextResponse.json({
    ok: true,
    resumen: {
      cuentas: cuentas.length,
      posts: postsData.length,
      plantillas: plantillasData.length,
      notas: notasData.length,
    },
  })
}
