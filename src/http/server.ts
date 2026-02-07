import { Elysia } from 'elysia'
import { approveOrder } from './routes/approve-order'
import { authenticateFromLink } from './routes/authenticate-from-link'
import { cancelOrder } from './routes/cancel-order'
import { deliverOrder } from './routes/deliver-order'
import { dispatchOrder } from './routes/dispatch-order'
import { getDayTotalOrdersAmount } from './routes/get-day-total-orders-amount'
import { getManagedRestaurant } from './routes/get-managed-restaurant'
import { getMonthlyRevenue } from './routes/get-monthly-revenue'
import { getOrderDetails } from './routes/get-order-details'
import { getOrders } from './routes/get-orders'
import { getProfile } from './routes/get-profile'
import { registerRestaurant } from './routes/register-restaurant'
import { sendAuthLink } from './routes/send-auth-link'
import { signOut } from './routes/sign-out'

const app = new Elysia()
  .use(registerRestaurant)
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(getManagedRestaurant)
  .use(getOrderDetails)
  .use(approveOrder)
  .use(cancelOrder)
  .use(deliverOrder)
  .use(dispatchOrder)
  .use(getOrders)
  .use(getMonthlyRevenue)
  .use(getDayTotalOrdersAmount)
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
        set.status = error.status
        return error.toResponse()
      case 'NOT_FOUND':
        return new Response(null, { status: 404 })
      default:
        // TODO: check why this log is not being printed to the console and the
        // error being directly returned to the client
        console.error(error)
        return new Response(null, { status: 500 })
    }
  })

app.listen(3333, () => {
  console.log('🔥 HTTP server running!')
})
