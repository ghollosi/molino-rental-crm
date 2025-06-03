import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'

// Mock NextAuth
const mockSignIn = jest.fn()
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: mockSignIn,
}))

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: /bejelentkezés/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail cím/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/jelszó/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bejelentkezés/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /bejelentkezés/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/e-mail cím kötelező/i)).toBeInTheDocument()
      expect(screen.getByText(/jelszó kötelező/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/e-mail cím/i)
    const submitButton = screen.getByRole('button', { name: /bejelentkezés/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/érvényes e-mail címet adjon meg/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/e-mail cím/i)
    const passwordInput = screen.getByLabelText(/jelszó/i)
    const submitButton = screen.getByRole('button', { name: /bejelentkezés/i })
    
    await user.type(emailInput, 'admin@molino.com')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'admin@molino.com',
        password: 'admin123',
        redirect: false,
      })
    })
  })

  it('should show error message for failed login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ 
      ok: false, 
      error: 'CredentialsSignin' 
    })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/e-mail cím/i)
    const passwordInput = screen.getByLabelText(/jelszó/i)
    const submitButton = screen.getByRole('button', { name: /bejelentkezés/i })
    
    await user.type(emailInput, 'wrong@email.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/hibás e-mail cím vagy jelszó/i)).toBeInTheDocument()
    })
  })

  it('should have link to registration page', () => {
    render(<LoginPage />)
    
    const registerLink = screen.getByText(/regisztráció/i)
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('should have forgot password link', () => {
    render(<LoginPage />)
    
    const forgotPasswordLink = screen.getByText(/elfelejtett jelszó/i)
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })
})