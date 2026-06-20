import { Container, ImageDrop, Menu, StatusBar } from '@niivue/react'
import { useStreamlitNiivue } from '../hooks/useStreamlitNiivue'
import { StreamlitArgs } from '../types'

interface StyledViewerProps {
  args: StreamlitArgs
}

export const StyledViewer = ({ args }: StyledViewerProps) => {
  const appProps = useStreamlitNiivue(args)

  return (
    <ImageDrop>
      <div className="flex flex-col h-full bg-gray-900">
        <Menu {...appProps} />
        <Container {...appProps} />
        <StatusBar {...appProps} />
      </div>
    </ImageDrop>
  )
}
