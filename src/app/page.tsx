import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to French version by default
  redirect('/fr')
}
