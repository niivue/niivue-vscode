import { ComponentProps, Streamlit, withStreamlitConnection } from 'streamlit-component-lib'
import { useEffect } from 'preact/hooks'
import { StreamlitArgs } from './types'
import { StyledViewer } from './components/StyledViewer'
import { UnstyledCanvas } from './components/UnstyledCanvas'

const StreamlitViewer = ({ args }: ComponentProps) => {
  const typedArgs = args as StreamlitArgs

  useEffect(() => {
    // Notify Streamlit that the component is ready
    Streamlit.setComponentReady()
  }, [])

  // Determine which component to render based on styled flag
  const styled = typedArgs.styled ?? true

  if (styled) {
    return <StyledViewer args={typedArgs} />
  } else {
    return <UnstyledCanvas args={typedArgs} />
  }
}

export default withStreamlitConnection(StreamlitViewer as any)
