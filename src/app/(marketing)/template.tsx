/** Soft fade-up on every marketing route change (CSS only; disabled under reduced motion). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
