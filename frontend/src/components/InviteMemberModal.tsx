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

  const handleClose = () => {
    setEmail('')
    onClose()
  }

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, open])

  if (!open) {
    return null
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
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              onInvite(email)
              setEmail('')
            }}
          >
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
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Send Invite</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
