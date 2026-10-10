import { AcaraDetail } from '../../../pages.jsx'
import seed from '../../../content.json'

// Halaman detail dibuat statis (cepat, bisa di-prefetch). Item baru dari admin dibuat otomatis saat pertama dibuka.
export function generateStaticParams() { return seed.acara.map((x) => ({ id: x.id })) }
export const dynamicParams = true

export default function Page() { return <AcaraDetail /> }
