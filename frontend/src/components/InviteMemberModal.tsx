import { useEffect, useState } from 'react'
import { MailPlus, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

type InviteMemberModalProps = {
  open: boolean
  onClose: () => void
  onInvite: (email: string) => void
}

export function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    setEmail('')
    setSubmitting(false)
    onClose()
  }

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  if (!open) {
    return null
  }


  async function handleSubmit(event: React.FormEvent<HTMLFormElement>)
  {
      event.preventDefault()

      const trimmedEmail = email.trim()
      if(!trimmedEmail) return

      try
      {
          setSubmitting(true)
          await onInvite(trimmedEmail)
          handleClose()
      } catch (error)
      {
        console.error('Error Inviting Member:', error)
        setSubmitting(false)
      }
  }

  return (
    <div className="modal-backdrop" onClick={handleClose} role="presentation">
      <Card className="modal-card invite-modal-card" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="modal-header">
          <div className="modal-kicker">
            <Users size={16} />
            <span>Grow the crew</span>
          </div>
          <h2>Invite a member</h2>
          <p className="form-copy">Send a simple invite so someone new can join this trip workspace.</p>
        </CardHeader>

        <CardContent>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <Label htmlFor="invite-email">Email</Label>
              <div className="input-icon-wrap">
                <MailPlus size={18} />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !email.trim()}>
                {submitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}