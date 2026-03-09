import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

const FAKE_PROFILES = {
  admin: {
    id: 'admin-user-id',
    full_name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
  user: {
    id: 'regular-user-id',
    full_name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
  },
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('selectedRole') || null)

  const profile = role ? FAKE_PROFILES[role] : null

  function selectRole(newRole) {
    localStorage.setItem('selectedRole', newRole)
    setRole(newRole)
  }

  function signOut() {
    localStorage.removeItem('selectedRole')
    setRole(null)
  }

  const value = {
    session: role ? { user: profile } : null,
    profile,
    loading: false,
    signOut,
    selectRole,
    refreshProfile: () => {},
    isAdmin: role === 'admin',
    isManager: false,
    isAdminOrManager: role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
