import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import chalk from 'chalk'
import { db } from './connection'
import {
  authLinksTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  restaurantsTable,
  usersTable,
} from './schema'

await db.delete(usersTable)
await db.delete(restaurantsTable)
await db.delete(orderItemsTable)
await db.delete(ordersTable)
await db.delete(productsTable)
await db.delete(authLinksTable)

console.log(chalk.yellow('✔ Database reset!'))

/**
 * Create customers
 */
const [customer1, customer2] = await db
  .insert(usersTable)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
  ])
  .returning()

console.log(chalk.yellow('✔ Customers created!'))

/**
 * Create manager
 */
const [manager] = await db
  .insert(usersTable)
  .values([
    {
      name: faker.person.fullName(),
      email: 'admin@admin.com',
      role: 'manager',
    },
  ])
  .returning({
    id: usersTable.id,
  })

console.log(chalk.yellow('✔ Manager created!'))

/**
 * Create restaurant
 */
const [restaurant] = await db
  .insert(restaurantsTable)
  .values([
    {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      managerId: manager?.id,
    },
  ])
  .returning()

console.log(chalk.yellow('✔ Restaurant created!'))

/**
 * Create products
 */
function generateProduct() {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    restaurantId: restaurant ? restaurant.id : '',
    priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 })),
  }
}

const availableProducts = await db
  .insert(productsTable)
  .values([
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
  ])
  .returning()

console.log(chalk.yellow('✔ Products created!'))

/**
 * Create orders
 */
type OrderItemInsert = typeof orderItemsTable.$inferInsert
type OrderInsert = typeof ordersTable.$inferInsert

const orderItemsToInsert: OrderItemInsert[] = []
const ordersToInsert: OrderInsert[] = []

for (let i = 0; i < 200; i++) {
  const orderId = createId()

  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 3,
  })

  let totalInCents = 0

  orderProducts.forEach(orderProduct => {
    const quantity = faker.number.int({ min: 1, max: 3 })

    totalInCents += orderProduct.priceInCents * quantity

    orderItemsToInsert.push({
      orderId,
      productId: orderProduct.id,
      priceInCents: orderProduct.priceInCents,
      quantity,
    })
  })

  ordersToInsert.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customer1?.id, customer2?.id]),
    restaurantId: restaurant ? restaurant.id : '',
    totalInCents,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'delivering',
      'delivered',
      'canceled',
    ]),
    createdAt: faker.date.recent({ days: 40 }),
  })
}

await db.insert(ordersTable).values(ordersToInsert)
await db.insert(orderItemsTable).values(orderItemsToInsert)

console.log(chalk.yellow('✔ Orders created!'))

console.log(chalk.greenBright('Database seeded successfully!'))

process.exit()
