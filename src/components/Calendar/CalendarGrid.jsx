import DayCell from './DayCell'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarGrid({
  year, month, scheduleMap, shiftTypes, onDayClick, selectedDay,
  isAdminOverride, pendingCancellations, loading
}) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7 // Mon=0

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDate = today.getDate()

  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="bg-gray-50 rounded-md min-h-[80px]" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const schedule = scheduleMap[day]
    const shiftType = schedule ? shiftTypes[schedule.shift_type_id] : null
    const isToday = isCurrentMonth && day === todayDate
    const hasPendingCancellation = pendingCancellations?.has(day)
    const status = schedule?.status

    cells.push(
      <DayCell
        key={day}
        day={day}
        shiftType={shiftType}
        isToday={isToday}
        isSelected={selectedDay === day}
        onClick={() => onDayClick(day)}
        status={status}
        hasPendingCancellation={hasPendingCancellation}
        loading={loading}
      />
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="bg-gray-100 rounded-md min-h-[80px] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map(d => (
        <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
      ))}
      {cells}
    </div>
  )
}
