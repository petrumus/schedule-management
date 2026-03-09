import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'

export default function ShiftDropdown({
  year, month, day, currentSelection, userId,
  shiftTypes, isAdminOverride, onSelect, onCancelRequest, onClose
}) {
  const [bonusSlots, setBonusSlots] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBonusSlots()
  }, [])

  async function fetchBonusSlots() {
    const bonusTypes = Object.values(shiftTypes).filter(st => st.is_bonus)
    if (bonusTypes.length === 0) {
      setLoading(false)
      return
    }

    const slots = {}
    for (const st of bonusTypes) {
      const { data: limit } = await supabase
        .from('bonus_limits')
        .select('max_slots')
        .eq('shift_type_id', st.id)
        .eq('year', year)
        .eq('month', month)
        .eq('day', day)
        .single()

      const maxSlots = limit?.max_slots || 0

      const { count } = await supabase
        .from('shift_selections')
        .select('*', { count: 'exact', head: true })
        .eq('shift_type_id', st.id)
        .eq('year', year)
        .eq('month', month)
        .eq('day', day)
        .eq('is_bonus', true)
        .eq('status', 'active')

      slots[st.id] = { max: maxSlots, remaining: maxSlots - (count || 0) }
    }
    setBonusSlots(slots)
    setLoading(false)
  }

  async function handleSelect(shiftType) {
    if (currentSelection?.is_bonus && currentSelection?.status === 'active' && !isAdminOverride) {
      onCancelRequest()
      return
    }

    if (shiftType.is_bonus && !isAdminOverride) {
      const slot = bonusSlots[shiftType.id]
      if (!slot || slot.remaining <= 0) {
        toast.error('No bonus slots remaining for this shift.')
        return
      }

      const { data: success } = await supabase.rpc('select_bonus_shift', {
        p_user_id: userId,
        p_year: year,
        p_month: month,
        p_day: day,
        p_shift_type_id: shiftType.id
      })

      if (success === false) {
        toast.error('No bonus slots remaining for this shift.')
        return
      }
      toast.success('Bonus shift selected!')
      onSelect()
      return
    }

    const { error } = await supabase
      .from('shift_selections')
      .upsert({
        user_id: userId,
        year, month, day,
        shift_type_id: shiftType.id,
        is_bonus: shiftType.is_bonus || false,
        status: 'active'
      }, { onConflict: 'user_id,year,month,day' })

    if (error) {
      toast.error('Failed to update shift.')
      console.error(error)
    } else {
      toast.success('Shift updated!')
      onSelect()
    }
  }

  const allShiftTypes = Object.values(shiftTypes)

  return (
    <div className="absolute z-40 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
      <div className="p-2">
        <div className="text-xs text-gray-500 font-medium mb-1 px-2">
          Select shift for Day {day}
        </div>
        {loading ? (
          <div className="text-sm text-gray-400 px-2 py-1">Loading...</div>
        ) : (
          allShiftTypes.map(st => {
            const isBonus = st.is_bonus
            const slot = bonusSlots[st.id]
            const disabled = isBonus && !isAdminOverride && slot && slot.remaining <= 0
            const isCurrent = currentSelection?.shift_type_id === st.id

            return (
              <button
                key={st.id}
                onClick={() => !disabled && handleSelect(st)}
                disabled={disabled}
                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
                } ${isCurrent ? 'bg-blue-50' : ''}`}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: st.color }}
                />
                <span className="flex-1">{st.name}</span>
                {isBonus && slot && (
                  <span className={`text-xs ${slot.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ({slot.remaining} left)
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
      <div className="border-t p-2">
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-1 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
