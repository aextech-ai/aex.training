import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEnrollment } from '@/lib/db/users'
import { COURSE_ID } from './course'

// Server only. True when the signed-in learner is enrolled in the paid pack (the Joan check, on
// this course's id). Any failure reads as not enrolled.
export async function hasPaidAccess(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    const aex_id = (session?.user as any)?.aex_id
    if (!aex_id) return false
    return !!(await getEnrollment(aex_id, COURSE_ID))
  } catch {
    return false
  }
}
