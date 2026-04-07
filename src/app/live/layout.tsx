/**
 * Server Component layout for /live route.
 * Plain <style> tag pre-rendered — dark background before JS loads, no FOUC.
 */
export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`.live-shell{background:#0a0a0a;min-height:100dvh}`}</style>
      <div className="live-shell">{children}</div>
    </>
  )
}
