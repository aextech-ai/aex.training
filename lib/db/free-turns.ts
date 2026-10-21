import { createHash } from 'crypto'
import { sql } from './client'

// Free persona turns, counted per visitor per UTC day (D-116 §6: free turns get a real cap first).
// A visitor is a hash of their IP with the day and a server secret, so no IP is stored and
// yesterday's buckets cannot be joined to today's. Table: free_turns in lib/db/schema.sql.

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function visitorBucket(ip: string, day: string, salt: string): string {
  return createHash('sha256').update(`${salt}|${day}|${ip}`).digest('hex')
}

/** Reserves one turn. Returns the turns left after it, or null when the cap is already reached. */
export async function takeFreeTurn(course: string, bucket: string, day: string, cap: number): Promise<number | null> {
  const result = await sql`
    INSERT INTO free_turns (course, bucket, day, turns)
    VALUES (${course}, ${bucket}, ${day}, 1)
    ON CONFLICT (course, bucket, day) DO UPDATE SET turns = free_turns.turns + 1
    WHERE free_turns.turns < ${cap}
    RETURNING turns
  `
  const turns = result.rows[0]?.turns
  return typeof turns === 'number' ? cap - turns : null
}

/** Gives back a reserved turn when the model call failed. */
export async function refundFreeTurn(course: string, bucket: string, day: string): Promise<void> {
  await sql`
    UPDATE free_turns SET turns = turns - 1
    WHERE course = ${course} AND bucket = ${bucket} AND day = ${day} AND turns > 0
  `
}

export async function freeTurnsLeft(course: string, bucket: string, day: string, cap: number): Promise<number> {
  const result = await sql`
    SELECT turns FROM free_turns WHERE course = ${course} AND bucket = ${bucket} AND day = ${day}
  `
  return Math.max(0, cap - (result.rows[0]?.turns ?? 0))
}
