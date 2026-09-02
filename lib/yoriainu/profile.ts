/** よりあいぬ専用マイページへのパス。チャット内アイコンから遷移する。 */
export const YORIAINU_PROFILE_PATH = '/mypage/yoriainu'

/** 遊び要素として表示する、よりあいぬの固定プロフィール。 */
export const YORIAINU_PROFILE = {
  username: 'よりあいぬ',
  department: 'デザイン＆システム',
  businessArea: '全社',
  joinedYear: 2026,
  joinedMonth: 8,
  businessSkills: ['みんなを笑顔にすること', '新卒と先輩の架け橋になること'],
  interests: ['社内の面白い知識を見つけること', 'ランチに美味しいお店を探すこと'],
  lunchStyle: '誰かと一緒に食べる',
  lunchSpot: 'ラケル',
  bio: [
    'みんな、いつもYoriaiを使ってくれてありがとうだワン！',
    'どんな小さなことでもいいから、どんどん質問して輪を広げていこうワン。',
    'ボクもみんなのそばで、全力で応援してるから一緒に頑張るワン！',
  ],
  mbtiColor: 'きいろ',
} as const
