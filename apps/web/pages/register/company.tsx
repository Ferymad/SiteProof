import { useRouter } from 'next/router'
import CompanyRegistrationFlow from '@/components/CompanyRegistrationFlow'

export default function CompanyRegistrationPage() {
  const router = useRouter()

  const handleRegistrationSuccess = () => {
    // Redirect to login page with success message for better UX
    router.push('/auth/login?message=registration_success')
  }

  return (
    <CompanyRegistrationFlow onSuccess={handleRegistrationSuccess} />
  )
}