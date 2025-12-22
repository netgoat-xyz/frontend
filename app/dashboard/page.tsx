import { redirect, RedirectType } from 'next/navigation'

export default function RedirectMetoPersonalTeam() {
  redirect('/dashboard/@me', RedirectType.push)
}