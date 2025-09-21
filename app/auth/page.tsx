import { AuthForm } from '@/components/auth'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full mx-4">
        <AuthForm />
      </div>
    </div>
  )
} 