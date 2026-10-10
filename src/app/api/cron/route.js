import handler from '../../../server/cron.js'
import { adapt } from '../../../server/adapt.js'

export const dynamic = 'force-dynamic'
const run = adapt(handler)
export const GET = run
export const POST = run
export const PUT = run
export const PATCH = run
export const DELETE = run
