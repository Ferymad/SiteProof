import { useRouter } from 'next/router'
import CompanyRegistrationFlow from '@/components/CompanyRegistrationFlow'

export default function CompanyRegistrationPage() {
  const router = useRouter()

  const handleRegistrationSuccess = () => {
    // Redirect to dashboard or login page after successful registration
    router.push('/?registered=true')
  }

  return (
    <CompanyRegistrationFlow onSuccess={handleRegistrationSuccess} />
  )
}