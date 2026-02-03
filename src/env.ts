import z from "zod";

const envSchema = z.object({
  POSTGRES_HOST: z.string().trim().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().trim().min(1),
  POSTGRES_PASSWORD: z.string().trim().min(1),
  POSTGRES_DB: z.string().trim().min(1),
})

const parsedEnv = envSchema.safeParse(typeof Bun !== 'undefined' ? Bun.env : process.env)

if (parsedEnv.success === false) {
  console.error(
    '🔴 Invalid environment variables\n',
    z.prettifyError(parsedEnv.error),
  );

  throw new Error();
}

export const env = parsedEnv.data;