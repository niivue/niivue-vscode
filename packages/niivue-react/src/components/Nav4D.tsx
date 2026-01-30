import { Signal, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'

interface Nav4DProps {
  nv: ExtendedNiivue
  volumeIndex: number
  vol4D: Signal<number>
  isPlaying: Signal<boolean>
  isEditingVol4D: Signal<boolean>
}

export const Nav4D = ({ nv, volumeIndex, vol4D, isPlaying, isEditingVol4D }: Nav4DProps) => {
  const vol4DInput = useSignal('')
  const vol4DInputRef = useRef<HTMLInputElement | null>(null)
  const playIntervalRef = useRef<number | null>(null)

  // Required so 4D volume number can be edited directly (without requiring second click)
  useEffect(() => {
    if (isEditingVol4D.value && vol4DInputRef.current) {
      vol4DInputRef.current.focus()
      vol4DInputRef.current.select()
    }
  }, [isEditingVol4D.value])

  // Cleanup play interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Sync isPlaying signal with interval
  useEffect(() => {
    if (!isPlaying.value && playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    } else if (isPlaying.value && !playIntervalRef.current) {
      startPlayback()
    }
  }, [isPlaying.value])

  const nextVolume = () => {
    const currentVol = nv.volumes[0].frame4D
    nv.setFrame4D(nv.volumes[0].id, currentVol + 1)
    vol4D.value = nv.volumes[0].frame4D
  }

  const prevVolume = () => {
    const currentVol = nv.volumes[0].frame4D
    nv.setFrame4D(nv.volumes[0].id, currentVol - 1)
    vol4D.value = nv.volumes[0].frame4D
  }

  const setVol4D = (value: number) => {
    const nFrame4D = nv.volumes[0]?.nFrame4D
    if (!nFrame4D) return
    const maxFrame = nFrame4D - 1
    const clampedValue = Math.max(0, Math.min(maxFrame, value))
    nv.setFrame4D(nv.volumes[0].id, clampedValue)
    vol4D.value = nv.volumes[0].frame4D
  }

  const handleVol4DClick = (e: MouseEvent) => {
    e.stopPropagation()
    isEditingVol4D.value = true
    vol4DInput.value = vol4D.value.toString()
  }

  const handleVol4DChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    vol4DInput.value = target.value
  }

  const handleVol4DKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const value = parseInt(vol4DInput.value, 10)
      if (!isNaN(value)) {
        setVol4D(value)
      }
      isEditingVol4D.value = false
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      vol4DInput.value = vol4D.value.toString() // Reset to current value
      isEditingVol4D.value = false
    }
  }

  const commitVol4DChange = () => {
    const value = parseInt(vol4DInput.value, 10)
    if (!isNaN(value)) {
      setVol4D(value)
    }
    isEditingVol4D.value = false
  }

  const startPlayback = () => {
    if (playIntervalRef.current) return
    playIntervalRef.current = window.setInterval(() => {
      const volume = nv.volumes[0]
      if (!volume) {
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current)
          playIntervalRef.current = null
        }
        isPlaying.value = false
        return
      }
      const nFrame4D = volume.nFrame4D
      if (!nFrame4D) return
      const currentFrame = volume.frame4D
      const nextFrame = (currentFrame + 1) % nFrame4D
      nv.setFrame4D(volume.id, nextFrame)
      vol4D.value = volume.frame4D
    }, 200)
  }

  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
  }

  return (
    <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-gray-900 bg-opacity-70 rounded-lg p-1 backdrop-blur-sm shadow-lg">
      <button
        className="bg-transparent hover:bg-white hover:bg-opacity-20 text-white rounded px-2 py-1 transition-colors text-xl leading-none flex items-center justify-center min-w-[30px]"
        onClick={prevVolume}
        aria-label="Previous frame"
        title="Previous frame"
      >
        -
      </button>

      {isEditingVol4D.value ? (
        <input
          ref={vol4DInputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={vol4DInput.value}
          onInput={handleVol4DChange}
          onKeyDown={handleVol4DKeyDown}
          onBlur={commitVol4DChange}
          className="bg-transparent text-white text-center w-12 outline-none border-b border-gray-500 focus:border-white transition-colors text-sm font-mono p-0"
          data-testid={`volume-input-${volumeIndex}`}
          aria-label="4D volume frame number"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="cursor-text text-white text-center w-12 hover:bg-white hover:bg-opacity-10 rounded px-1 transition-colors text-sm font-mono select-none"
          data-testid={`volume-${volumeIndex}`}
          onClick={handleVol4DClick}
          title="Click to edit frame number"
        >
          {vol4D.value}
        </span>
      )}

      <button
        className="bg-transparent hover:bg-white hover:bg-opacity-20 text-white rounded px-2 py-1 transition-colors text-xl leading-none flex items-center justify-center min-w-[30px]"
        onClick={nextVolume}
        aria-label="Next frame"
        title="Next frame"
      >
        +
      </button>

      <div className="w-px h-4 bg-gray-600 mx-1"></div>

      <button
        className="bg-transparent hover:bg-white hover:bg-opacity-20 text-white rounded px-2 py-1 transition-colors flex items-center justify-center min-w-[30px]"
        onClick={togglePlay}
        aria-label={isPlaying.value ? 'Pause' : 'Play'}
        title={isPlaying.value ? 'Pause' : 'Play'}
        data-testid={`volume-play-${volumeIndex}`}
      >
        {isPlaying.value ? '⏸' : '▶'}
      </button>
    </div>
  )
}
