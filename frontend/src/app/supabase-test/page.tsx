import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select()

  return (
    <div style={{ padding: '2rem', color: '#fff', backgroundColor: '#000', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Supabase Connection Test</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {todos && todos.length === 0 && <p>Connection successful! (No rows found in 'todos' table yet)</p>}
      <ul style={{ marginTop: '1rem' }}>
        {todos?.map((todo: any) => (
          <li key={todo.id} style={{ padding: '0.5rem 0' }}>{todo.name || todo.title || JSON.stringify(todo)}</li>
        ))}
      </ul>
    </div>
  )
}
