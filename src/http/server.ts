import { Elysia } from 'elysia'
import { db } from '../database/connection'
import { restaurantsTable, usersTable } from '../database/schema'

const app = new Elysia().post('/restaurants', async ({ body, set }) => {
  const { restaurantName, name, email, phone } = body as any

  const [manager] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      phone,
      role: 'manager',
    })
    .returning({
      id: usersTable.id,
    })

  await db.insert(restaurantsTable).values({
    name: restaurantName,
    managerId: manager?.id,
  })

  set.status = 204
})

app.listen(3333, () => {
  console.log('🔥 HTTP server running!')
})
