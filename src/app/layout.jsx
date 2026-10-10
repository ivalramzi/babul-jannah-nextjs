import '../styles.css'
import Providers from '../shell.jsx'
import { Nav } from '../components.jsx'
import Footer from '../footer.jsx'

const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000')
const desc = 'Majelis Ta’lim Babul Jannah — ngaji bareng, jadwal kajian, acara, dan artikel keislaman.'

export const metadata = {
  metadataBase: new URL(base),
  title: { default: 'Babul Jannah — Majelis Ta’lim', template: '%s — Babul Jannah' },
  description: desc,
  manifest: '/manifest.webmanifest',
  icons: { icon: '/logo-64.png', apple: '/logo-128.png' },
  openGraph: { title: 'Babul Jannah — Majelis Ta’lim', description: desc, images: ['/logo-512.png'], locale: 'id_ID', type: 'website' },
  appleWebApp: { capable: true, title: 'Babul Jannah' },
}
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f4f8ec' }

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Young+Serif&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL@24,400,0..1&icon_names=add,add_photo_alternate,arrow_back,arrow_downward,arrow_upward,article,bookmark,calendar_month,campaign,chat_bubble,check,chevron_left,chevron_right,close,crop,delete,download,edit,event,favorite,grid_view,history,home,hourglass_empty,location_on,lock,logout,mail,notifications,notifications_active,person,photo_library,push_pin,restart_alt,schedule,send,star,target,upload,visibility,visibility_off&display=block" rel="stylesheet" />
      </head>
      <body>
        <Providers />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
