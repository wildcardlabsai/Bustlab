import { ButtonLink } from '@/components/ui/Button'
import { Seo } from '@/components/seo/Seo'

export default function NotFound({ title = 'Page not found', message = 'The page you are looking for has moved or no longer exists.' }: { title?: string; message?: string }) {
  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <Seo title={title} noindex />
      <p className="font-display text-[clamp(6rem,20vw,12rem)] font-bold leading-none text-gradient-purple">404</p>
      <h1 className="display mt-4 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-md text-muted">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/">Back to home</ButtonLink>
        <ButtonLink to="/collections" variant="secondary">Browse collections</ButtonLink>
      </div>
    </section>
  )
}
