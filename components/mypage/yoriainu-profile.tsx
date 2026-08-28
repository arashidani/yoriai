import Image from 'next/image'
import mascotAiAvatarImage from '@/assets/mascots/mascot_ai_avatar.svg'
import { TenureChip } from '@/components/design-system/ui/tenure-chip'
import { YORIAINU_PROFILE } from '@/lib/yoriainu/profile'
import { ProfileField } from './profile-field'

/** よりあいぬの固定プロフィール表示。編集不可。 */
export function YoriainuProfileView() {
  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="relative size-35 shrink-0">
        <Image
          src={mascotAiAvatarImage}
          alt="よりあいぬ"
          width={140}
          height={140}
          className="size-35 rounded-lg object-cover"
        />
      </div>

      <div className="w-full flex-1">
        <ProfileField label="ニックネーム" value={YORIAINU_PROFILE.username} />
        <ProfileField label="所属部署" value={YORIAINU_PROFILE.department} />
        <ProfileField label="勤務エリア" value={YORIAINU_PROFILE.businessArea} />
        <div className="flex items-center gap-2">
          <ProfileField
            label="入社年月"
            value={`${YORIAINU_PROFILE.joinedYear}年 ${YORIAINU_PROFILE.joinedMonth}月`}
          />
          <TenureChip size="default">IBJ歴</TenureChip>
        </div>
        <ProfileField label="ビジネススキル" value={[...YORIAINU_PROFILE.businessSkills]} />
        <ProfileField label="趣味" value={[...YORIAINU_PROFILE.interests]} />
        <ProfileField label="ランチスタイル" value={YORIAINU_PROFILE.lunchStyle} />
        <ProfileField label="ランチスポット" value={YORIAINU_PROFILE.lunchSpot} />
        <ProfileField label="ひとこと" value={[...YORIAINU_PROFILE.bio]} />
        <ProfileField label="MBTIの色" value={YORIAINU_PROFILE.mbtiColor} />
      </div>
    </div>
  )
}
