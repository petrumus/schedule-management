export default function DayCell({
  day, shiftType, isToday, isSelected, onClick, status, hasPendingCancellation, loading
}) {
  const borderClasses = isToday
    ? 'border-2 border-blue-500'
    : isSelected
      ? 'border-2 border-indigo-400'
      : 'border border-gray-200'

  const pendingClass = hasPendingCancellation ? 'ring-2 ring-orange-300' : ''

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-md min-h-[80px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${borderClasses} ${pendingClass}`}
    >
      <div className="text-sm text-gray-700 font-medium">{day}</div>
      <div className="mt-1">
        {shiftType ? (
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full font-medium text-white"
            style={{ backgroundColor: shiftType.color || '#6B7280' }}
          >
            {shiftType.name}
          </span>
        ) : (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-500">
            Not set
          </span>
        )}
        {status === 'cancellation_requested' && (
          <span className="block text-xs text-orange-500 mt-1" title="Cancellation pending">
            &#128339; Pending
          </span>
        )}
      </div>
    </div>
  )
}
