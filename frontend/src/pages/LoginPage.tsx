import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      await login({ email, password })
      navigate('/dashboard')
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Unable to log in right now')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Travel planning feels easier when the whole group is aligned."
      subtitle="Log in to pick up your itinerary, coordinate decisions, and keep every traveler on the same page."
    >
      <Card>
        <CardHeader>
          <p className="form-kicker">GroupGo</p>
          <h2>Log in</h2>
          <p className="form-copy">Plan your next trip without losing the thread.</p>
        </CardHeader>

        <CardContent>
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="field-group">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <div className="field-header">
                <Label htmlFor="password">Password</Label>
                <a href="/" onClick={(event) => event.preventDefault()}>
                  Forgot?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <p className="form-hint">Use at least 8 characters.</p>
            </div>

            {error ? <p className="form-message form-message-error">{error}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
