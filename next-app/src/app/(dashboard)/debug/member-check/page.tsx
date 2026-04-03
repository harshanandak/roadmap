import { MemberCheckTool } from '@/components/internal-tools/member-check-tool'
import { requireInternalToolAccess } from '@/lib/internal-tools'

export default async function MemberCheckPage() {
  await requireInternalToolAccess()

  return <MemberCheckTool />
}
