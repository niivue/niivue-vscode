import { App, type AppProps } from '@niivue/react'
import { computed } from '@preact/signals'
import { HomeScreen } from './components/HomeScreen'

export const Pwa = ({ appProps }: { appProps: AppProps }) => {
  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0)

  return (
    <>
      <App appProps={appProps} />
      {showHomeScreen.value && (
        <div className="absolute inset-0 bg-gray-800 z-10 flex flex-col items-start justify-start overflow-y-auto">
          <HomeScreen />
        </div>
      )}
    </>
  )
}
