import type Elysia from 'elysia'
import { auth } from '../auth'

export const signOut = (app: Elysia) => {
  app.use(auth).post('/sign-out', async ({ signOut: internalSignOut }) => {
    internalSignOut()
  })
}
