import { faker } from '@faker-js/faker'
import chalk from 'chalk'
import { db } from './connection'
import { restaurantsTable, usersTable } from './schema'

await db.delete(usersTable)
await db.delete(restaurantsTable)

console.log(chalk.yellow('✔ Database reset!'))

await db.insert(usersTable).values([
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

console.log(chalk.yellow('✔ Customers created!'))

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

await db.insert(restaurantsTable).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: manager?.id,
  },
])

console.log(chalk.yellow('✔ Restaurant created!'))

console.log(chalk.greenBright('Database seeded successfully!'))

process.exit()
