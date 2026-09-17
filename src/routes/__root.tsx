import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanStackDevtools } from '@tanstack/react-devtools'
import { AppShell } from '../components/layout/AppShell'
import { getAuthSessionFn } from '../server/auth/actions'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  loader: async () => {
    const admin = await getAuthSessionFn()
    return { admin }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SIALAY — Sistem Administrasi MundingLaya',
      },
      {
        name: 'description',
        content: 'Sistem Administrasi Internal SSB MUNDINGLAYA',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { admin } = Route.useLoaderData()

  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-[#0f172a] bg-[#f8fafc]">
        <AppShell admin={admin}>{children}</AppShell>
        {/* {process.env.NODE_ENV !== 'production' && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )} */}
        <Scripts />
      </body>
    </html>
  )
}
