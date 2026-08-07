import { describe, expect, it } from 'vitest'
import { COMPANY_EMAIL_ERROR, registerFormSchema } from '@/lib/schemas/register'

const validInput = {
  name: '山田 太郎',
  email: 'taro@ibjapan.jp',
  password: 'password1',
}

describe('registerFormSchema', () => {
  it('ibjapan.jpドメインのメールアドレスを許可する', () => {
    expect(registerFormSchema.safeParse(validInput).success).toBe(true)
  })

  it('会社ドメインの大文字小文字を区別せず許可する', () => {
    expect(registerFormSchema.safeParse({ ...validInput, email: 'taro@IBJAPAN.JP' }).success).toBe(
      true,
    )
  })

  it('会社ドメイン以外のメールアドレスを拒否する', () => {
    const result = registerFormSchema.safeParse({ ...validInput, email: 'taro@example.com' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(COMPANY_EMAIL_ERROR)
    }
  })

  it('会社ドメインに似ているだけのドメインを拒否する', () => {
    expect(
      registerFormSchema.safeParse({ ...validInput, email: 'taro@fakeibjapan.jp' }).success,
    ).toBe(false)
  })
})
