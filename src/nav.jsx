'use client'
import NextLink from 'next/link'
import { usePathname, useParams as useNextParams } from 'next/navigation'

export const Link = ({ to, ...p }) => <NextLink href={to} {...p} />
export function NavLink({ to, end, className, children, ...p }) {
  const path = usePathname() || '/'
  const active = end ? path === to : path === to || path.startsWith(to + '/')
  return <NextLink href={to} className={[className, active && 'active'].filter(Boolean).join(' ') || undefined} aria-current={active ? 'page' : undefined} {...p}>{children}</NextLink>
}
export const useParams = () => useNextParams() || {}
export const useLocation = () => ({ pathname: usePathname() || '/' })
