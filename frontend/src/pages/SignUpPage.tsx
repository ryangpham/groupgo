import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function SignUpPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      await signUp({ email, display_name: name, password })
      navigate('/dashboard')
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Unable to create your account right now')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="New trip, new crew"
      title="Create your account and start organizing travel together."
      subtitle="Set up your profile, invite friends, and turn scattered plans into one shared home base."
    >
      <Card>
        <CardHeader>
          <p className="form-kicker">Join GroupGo</p>
          <h2>Create account</h2>
          <p className="form-copy">Start planning in a workspace built for groups.</p>
        </CardHeader>

        <CardContent>
          <form className="auth-form" onSubmit={handleSignUp}>
            <div className="field-group">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <p className="form-hint">Use at least 8 characters.</p>
            </div>

            {error ? <p className="form-message form-message-error">{error}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
