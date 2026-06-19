import { ComponentChildren } from 'preact'

/**
 * A titled block for the standalone hosts' empty-state home screens (PWA,
 * desktop). The two home screens carry host-specific copy but should look
 * identical, so the shared heading/body styling lives here instead of being
 * copy-pasted into each app.
 *
 * `children` render inside a paragraph; inline content (links, <img>, <kbd>,
 * <b>/<i>) is fine. Standalone controls (e.g. a button) belong between
 * sections, not inside one.
 */
export const HomeSection = ({
  title,
  children,
}: {
  title: string
  children: ComponentChildren
}) => (
  <>
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 py-2 px-4">{title}</h2>
    <p className="w-full sm:w-96 mb-4 text-m font-normal text-gray-300 px-4">{children}</p>
  </>
)
