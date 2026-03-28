import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/dashboard')
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
                required
              />
            </div>

            <Button type="submit">Log In</Button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
