import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { LabelInfo } from './labelSelection'

interface LabelSelectionPanelProps {
  labels: LabelInfo[]
  onLabelToggle: (labelValue: number, visible: boolean) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onClose: () => void
}

export const LabelSelectionPanel = (props: LabelSelectionPanelProps) => {
  const { labels, onLabelToggle, onSelectAll, onDeselectAll, onClose } = props
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLabels = useMemo(() => {
    if (!searchQuery.trim()) {
      return labels
    }
    const query = searchQuery.toLowerCase()
    return labels.filter(
      (label) =>
        label.name?.toLowerCase().includes(query) || label.value.toString().includes(query),
    )
  }, [labels, searchQuery])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Handle large label sets with incremental loading
  const VISIBLE_LABELS_LIMIT = 100
  const [visibleCount, setVisibleCount] = useState(VISIBLE_LABELS_LIMIT)

  useEffect(() => {
    setVisibleCount(VISIBLE_LABELS_LIMIT)
  }, [filteredLabels.length])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setVisibleCount((prev) => Math.min(prev + 50, filteredLabels.length))
      }
    }
  }

  const displayLabels = filteredLabels.slice(0, visibleCount)
  const hasMoreLabels = filteredLabels.length > visibleCount

  return (
    <div className="absolute left-8 top-32 bg-gray-500 rounded-md z-50 p-3 min-w-[280px] max-w-[400px] max-h-[400px] flex flex-col">
      {/* Header with search */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-600">
        <span className="text-white text-sm font-bold">Label Visibility ({labels.length})</span>
        <div className="space-x-1">
          <button
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded transition-colors"
            onClick={onSelectAll}
            title="Show all labels"
          >
            All
          </button>
          <button
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded transition-colors"
            onClick={onDeselectAll}
            title="Hide all labels"
          >
            None
          </button>
        </div>
      </div>

      {/* Search box for large label sets */}
      {labels.length > 10 && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      )}

      {/* Scrollable label list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-1 pr-2 min-h-[100px] max-h-[250px]"
      >
        {displayLabels.map((label) => (
          <div
            key={label.value}
            className="flex items-center space-x-2 hover:bg-gray-600 rounded px-2 py-1.5 transition-colors cursor-pointer"
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName !== 'INPUT') {
                onLabelToggle(label.value, !label.visible)
              }
            }}
          >
            <input
              type="checkbox"
              checked={label.visible}
              onChange={(e) => {
                e.stopPropagation()
                onLabelToggle(label.value, e.currentTarget.checked)
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 cursor-pointer accent-blue-500"
              id={`label-${label.value}`}
            />
            <div
              className="w-4 h-4 rounded-sm border border-gray-400 flex-shrink-0"
              style={{
                backgroundColor: `rgb(${label.color[0]}, ${label.color[1]}, ${label.color[2]})`,
              }}
              title={`Label ${label.value}: ${label.name || 'Unnamed'}`}
            />
            <label
              htmlFor={`label-${label.value}`}
              className="text-white text-sm cursor-pointer flex-1 truncate"
              title={label.name || `Label ${label.value}`}
            >
              {label.name || `Label ${label.value}`}
            </label>
            <span className="text-gray-400 text-xs">#{label.value}</span>
          </div>
        ))}

        {hasMoreLabels && (
          <div className="text-center py-2 text-gray-400 text-xs">
            Loading more labels... ({visibleCount}/{filteredLabels.length})
          </div>
        )}

        {filteredLabels.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            {searchQuery ? 'No labels match your search' : 'No labels found'}
          </div>
        )}
      </div>

      {/* Footer with count and close */}
      <div className="mt-3 pt-2 border-t border-gray-600 flex justify-between items-center">
        <span className="text-gray-400 text-xs">
          {labels.filter((l) => l.visible).length} of {labels.length} visible
        </span>
        <button
          className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-4 py-1.5 rounded transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
