import { describe, expect, it } from 'vitest'
import { projectUrl } from './supabase'

describe('projectUrl', () => {
  it('fica só com o endereço do projeto', () => {
    expect(projectUrl('https://abcd.supabase.co')).toBe('https://abcd.supabase.co')
    expect(projectUrl('https://abcd.supabase.co/')).toBe('https://abcd.supabase.co')
    expect(projectUrl('https://abcd.supabase.co/rest/v1/')).toBe('https://abcd.supabase.co')
    expect(projectUrl('  https://abcd.supabase.co/auth/v1 \n')).toBe('https://abcd.supabase.co')
    expect(projectUrl('http://127.0.0.1:54321')).toBe('http://127.0.0.1:54321')
    expect(projectUrl('')).toBeUndefined()
  })
})
