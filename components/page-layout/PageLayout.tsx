
export function PageLayout ({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      {children}
    </div>
  )
}

function Sidebar () {
  return (
    <div>Sidebar!</div>
  )
}