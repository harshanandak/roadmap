import { SetupUsersTool } from '@/components/internal-tools/setup-users-tool'
import { requireInternalToolAccess } from '@/lib/internal-tools'

export default async function SetupUsersPage() {
  await requireInternalToolAccess()

  return <SetupUsersTool />
}
