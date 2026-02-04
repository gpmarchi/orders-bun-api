import z from 'zod'

const envSchema = z.object({
  POSTGRES_HOST: z.string().trim().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().trim().min(1),
  POSTGRES_PASSWORD: z.string().trim().min(1),
  POSTGRES_DB: z.string().trim().min(1),
  DATABASE_URL: z
    .url({
      protocol: /^postgresql?$/,
    })
    .optional(),
  API_BASE_URL: z.url().min(1),
  AUTH_REDIRECT_URL: z.url().min(1),
  JWT_SECRET_KEY: z.string().min(1),
})

const parsedEnv = envSchema.safeParse(
  typeof Bun !== 'undefined' ? Bun.env : process.env
)

if (parsedEnv.success === false) {
  console.error(
    '🔴 Invalid environment variables\n',
    z.prettifyError(parsedEnv.error)
  )

  throw new Error()
}

export const env = {
  ...parsedEnv.data,
  DATABASE_URL: `postgresql://${parsedEnv.data.POSTGRES_USER}:${parsedEnv.data.POSTGRES_PASSWORD}@${parsedEnv.data.POSTGRES_HOST}:${parsedEnv.data.POSTGRES_PORT}/${parsedEnv.data.POSTGRES_DB}`,
}
