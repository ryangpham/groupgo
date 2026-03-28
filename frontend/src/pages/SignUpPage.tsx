import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function SignUpPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/dashboard')
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
                required
              />
            </div>

            <Button type="submit">Create Account</Button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
