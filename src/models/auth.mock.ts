export interface User {
  id: string
  name: string
  nickname: string
  age: number
  email: string
  points: number
  level: number
}

export interface AuthState {
  user: User | null
  token: string | null
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Ana',
    nickname: 'Aninha',
    age: 8,
    email: 'ana@exemplo.com',
    points: 420,
    level: 3,
  },
]

let currentAuth: AuthState = {
  user: null,
  token: null,
}

export function getCurrentUser(): User | null {
  const raw = sessionStorage.getItem('apprender_user')
  if (raw) {
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  }
  return currentAuth.user
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export async function signIn(email: string, _password: string): Promise<User> {
  await delay(600)
  const found = MOCK_USERS.find((u) => u.email === email)
  if (!found) throw new Error('Usuário ou senha incorretos.')
  const token = `mock-jwt-${found.id}-${Date.now()}`
  currentAuth = { user: found, token }
  sessionStorage.setItem('apprender_user', JSON.stringify(found))
  sessionStorage.setItem('apprender_token', token)
  return found
}

export async function register(data: {
  name: string
  age: number
  nickname: string
  email: string
  password: string
}): Promise<User> {
  await delay(800)
  const existing = MOCK_USERS.find((u) => u.email === data.email)
  if (existing) throw new Error('Este e-mail já está em uso.')
  const newUser: User = {
    id: String(MOCK_USERS.length + 1),
    name: data.name,
    nickname: data.nickname,
    age: data.age,
    email: data.email,
    points: 0,
    level: 1,
  }
  MOCK_USERS.push(newUser)
  const token = `mock-jwt-${newUser.id}-${Date.now()}`
  currentAuth = { user: newUser, token }
  sessionStorage.setItem('apprender_user', JSON.stringify(newUser))
  sessionStorage.setItem('apprender_token', token)
  return newUser
}

export async function forgotPassword(_email: string): Promise<void> {
  await delay(500)
  // Mock: apenas simula o envio do e-mail
}

export function logout(): void {
  currentAuth = { user: null, token: null }
  sessionStorage.removeItem('apprender_user')
  sessionStorage.removeItem('apprender_token')
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
