import { Container } from '@niivue/react'
import { useStreamlitNiivue } from '../hooks/useStreamlitNiivue'
import { StreamlitArgs } from '../types'

interface UnstyledCanvasProps {
  args: StreamlitArgs
}

export const UnstyledCanvas = ({ args }: UnstyledCanvasProps) => {
  const appProps = useStreamlitNiivue(args)

  return (
    <div className="w-full h-full bg-gray-900">
      <Container {...appProps} />
    </div>
  )
}
