import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App mobile-first flow shell', () => {
  it('renders the capture flow by default', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: 'LINE bot สำหรับร้านเล็ก ที่บันทึกรายรับรายจ่ายได้ทันทีบนมือถือ',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ถ่ายสลิป' })).toHaveClass('active')
    expect(screen.getByText('Makro Receipt')).toBeInTheDocument()
  })

  it('switches to the text entry flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'พิมพ์ข้อความ' }))

    expect(screen.getByRole('button', { name: 'พิมพ์ข้อความ' })).toHaveClass('active')
    expect(
      screen.getByRole('heading', {
        name: 'พิมพ์ข้อความแล้วให้ AI จัดโครงข้อมูลเป็น ledger draft',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ยืนยันและบันทึก' })).toBeInTheDocument()
  })

  it('switches to the daily summary flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'สรุปรายวัน' }))

    expect(screen.getByRole('button', { name: 'สรุปรายวัน' })).toHaveClass('active')
    expect(
      screen.getByRole('heading', { name: 'สรุปรายวันก่อน push เข้า LINE เวลา 00:30' }),
    ).toBeInTheDocument()
    expect(screen.getByText('฿8,200')).toBeInTheDocument()
  })
})
