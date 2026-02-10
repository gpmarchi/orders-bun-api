import { Elysia } from 'elysia'
import { approveOrder } from './routes/approve-order'
import { authenticateFromLink } from './routes/authenticate-from-link'
import { cancelOrder } from './routes/cancel-order'
import { deliverOrder } from './routes/deliver-order'
import { dispatchOrder } from './routes/dispatch-order'
import { getDailyRevenueFromPeriod } from './routes/get-daily-revenue-from-period'
import { getDayTotalOrdersAmount } from './routes/get-day-total-orders-amount'
import { getManagedRestaurant } from './routes/get-managed-restaurant'
import { getMonthlyCanceledOrdersAmount } from './routes/get-monthly-canceled-orders-amount'
import { getMonthlyOrdersAmount } from './routes/get-monthly-orders-amount'
import { getMonthlyRevenue } from './routes/get-monthly-revenue'
import { getOrderDetails } from './routes/get-order-details'
import { getOrders } from './routes/get-orders'
import { getPopularProducts } from './routes/get-popular-products'
import { getProfile } from './routes/get-profile'
import { registerRestaurant } from './routes/register-restaurant'
import { sendAuthLink } from './routes/send-auth-link'
import { signOut } from './routes/sign-out'

const app = new Elysia()

app.onError(({ code, error, set }) => {
  switch (code) {
    case 'VALIDATION':
      set.status = error.status
      return error.toResponse()
    case 'NOT_FOUND':
      return new Response(null, { status: 404 })
    default:
      console.error(error)
      return new Response(null, { status: 500 })
  }
})

registerRestaurant(app)
sendAuthLink(app)
authenticateFromLink(app)
signOut(app)
getProfile(app)
getManagedRestaurant(app)
getOrderDetails(app)
approveOrder(app)
cancelOrder(app)
deliverOrder(app)
dispatchOrder(app)
getOrders(app)
getMonthlyRevenue(app)
getDayTotalOrdersAmount(app)
getMonthlyOrdersAmount(app)
getMonthlyCanceledOrdersAmount(app)
getPopularProducts(app)
getDailyRevenueFromPeriod(app)

app.listen(3333, () => {
  console.log('🔥 HTTP server running!')
})
