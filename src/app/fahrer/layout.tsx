/**
 * Server Component layout for /fahrer routes.
 * Plain <style> tag (not styled-jsx) is pre-rendered into the initial HTML,
 * so the dark background is present BEFORE any JS loads — no FOUC.
 */
export default function FahrerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`.fahrer-shell{background:#0a0a0a;min-height:100dvh}`}</style>
      <div className="fahrer-shell">{children}</div>
    </>
  )
}
