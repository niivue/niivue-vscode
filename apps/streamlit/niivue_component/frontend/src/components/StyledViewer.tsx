import { Container, ImageDrop, Menu } from '@niivue/react'
import { useStreamlitNiivue } from '../hooks/useStreamlitNiivue'
import { StreamlitArgs } from '../types'

interface StyledViewerProps {
  args: StreamlitArgs
}

export const StyledViewer = ({ args }: StyledViewerProps) => {
  const appProps = useStreamlitNiivue(args)
  const { location } = appProps

  return (
    <ImageDrop>
      <div className="flex flex-col h-full bg-gray-900">
        <Menu {...appProps} />
        <Container {...appProps} />
        <div className="pl-2 text-sm text-gray-300">{location?.value || '\u00A0'}</div>
      </div>
    </ImageDrop>
  )
}
