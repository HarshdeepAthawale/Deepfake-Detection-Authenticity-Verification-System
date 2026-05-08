"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Save } from "lucide-react"
import { toast } from "sonner"

interface ProfileInfoFormProps {
  onUpdate?: () => void
}

export default function ProfileInfoForm({ onUpdate }: ProfileInfoFormProps) {
  const { user } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [department, setDepartment] = useState("")
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (user?.metadata) {
      setFirstName(user.metadata.firstName || "")
      setLastName(user.metadata.lastName || "")
      setDepartment(user.metadata.department || "")
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    if (field === "firstName") setFirstName(value)
    if (field === "lastName") setLastName(value)
    if (field === "department") setDepartment(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setSaving(true)
    try {
      await apiService.updateProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        department: department || undefined,
      })

      toast.success("Profile updated successfully")
      setHasChanges(false)
      onUpdate?.()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-card/50 max-w-2xl">
      <CardHeader className="border-b border-primary/20 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">PERSONAL INFO</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-primary uppercase block mb-2">First Name</label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Enter first name"
            className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-primary uppercase block mb-2">Last Name</label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Enter last name"
            className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-primary uppercase block mb-2">Department</label>
          <Input
            type="text"
            value={department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="Enter department"
            className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase h-10"
        >
          <Save size={16} className="mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  )
}
