import { useState } from 'react'
import './App.css'

type TabKey = 'capture' | 'entry' | 'summary'
type EntryType = 'income' | 'expense'

type Category = {
  id: string
  label: string
  tone: 'income' | 'expense'
}

const captureCategories: Category[] = [
  { id: 'ingredients', label: 'ค่าวัตถุดิบ', tone: 'expense' },
  { id: 'ads', label: 'ค่าโฆษณา', tone: 'expense' },
  { id: 'loan', label: 'ค่าสินเชื่อ', tone: 'expense' },
  { id: 'other-expense', label: 'รายจ่ายอื่นๆ', tone: 'expense' },
]

const textCategories: Category[] = [
  { id: 'storefront', label: 'รายรับหน้าร้าน', tone: 'income' },
  { id: 'delivery', label: 'รายรับเดลิเวอรี่', tone: 'income' },
  { id: 'other-income', label: 'รายรับอื่นๆ', tone: 'income' },
]

const summaryCards = [
  { label: 'รายรับวันนี้', value: '฿12,500', delta: '+14% จากเมื่อวาน', tone: 'income' },
  { label: 'รายจ่ายวันนี้', value: '฿4,300', delta: 'ลดลง 8%', tone: 'expense' },
  { label: 'คงเหลือสุทธิ', value: '฿8,200', delta: 'พร้อมส่งสรุป 00:30', tone: 'neutral' },
]

const summaryFeed = [
  { time: '09:10', title: 'ขายหน้าร้าน', amount: '+฿3,500', meta: 'พิมพ์ข้อความโดยเจ้าของร้าน' },
  { time: '11:42', title: 'Makro', amount: '-฿1,250', meta: 'AI อ่านจากใบเสร็จ + เก็บรูปใน Drive' },
  { time: '15:08', title: 'ค่าโฆษณา', amount: '-฿800', meta: 'ยืนยันจาก draft ใน LINE' },
  { time: '19:25', title: 'ขายเดลิเวอรี่', amount: '+฿2,900', meta: 'ข้อความ + auto-suggest หมวดหมู่' },
]

const textExamples = [
  'รายได้ 3,500 ขายหน้าร้าน',
  'รายจ่าย ซื้อของแมคโคร 3,500',
  'รายจ่ายค่าโฆษณา 1,200',
]

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('capture')
  const [captureCategory, setCaptureCategory] = useState(captureCategories[0].id)
  const [textCategory, setTextCategory] = useState(textCategories[0].id)
  const [entryType, setEntryType] = useState<EntryType>('income')
  const [selectedExample, setSelectedExample] = useState(textExamples[0])

  const captureCategoryLabel =
    captureCategories.find((category) => category.id === captureCategory)?.label ?? ''
  const textCategoryLabel =
    textCategories.find((category) => category.id === textCategory)?.label ?? ''

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Somjeed AI Phase 1</span>
          <h1>LINE bot สำหรับร้านเล็ก ที่บันทึกรายรับรายจ่ายได้ทันทีบนมือถือ</h1>
          <p>
            mobile-first dashboard นี้ออกแบบให้เจ้าของร้านเห็น 3 flow หลักในจอเดียว:
            ถ่ายสลิป, พิมพ์ข้อความ, และดูสรุปรายวันก่อนส่งเข้า LINE ตอน 00:30
          </p>
        </div>

        <div className="hero-metrics" aria-label="project highlights">
          <article>
            <strong>3 Main Flows</strong>
            <span>Capture, Text, Summary</span>
          </article>
          <article>
            <strong>AI + Human Confirm</strong>
            <span>OpenAI extract แล้วให้ user ยืนยันก่อนบันทึก</span>
          </article>
          <article>
            <strong>Google Ops Ready</strong>
            <span>Google Sheet เป็น reporting, Drive เก็บรูปต้นฉบับ</span>
          </article>
        </div>
      </section>

      <section className="mobile-frame">
        <header className="phone-header">
          <div>
            <p className="device-label">Mobile-first preview</p>
            <h2>Somjeed Control View</h2>
          </div>
          <span className="status-pill">พร้อมเชื่อม LINE / OpenAI</span>
        </header>

        <nav className="tab-strip" aria-label="Primary flows">
          <button
            type="button"
            className={activeTab === 'capture' ? 'active' : ''}
            onClick={() => setActiveTab('capture')}
          >
            ถ่ายสลิป
          </button>
          <button
            type="button"
            className={activeTab === 'entry' ? 'active' : ''}
            onClick={() => setActiveTab('entry')}
          >
            พิมพ์ข้อความ
          </button>
          <button
            type="button"
            className={activeTab === 'summary' ? 'active' : ''}
            onClick={() => setActiveTab('summary')}
          >
            สรุปรายวัน
          </button>
        </nav>

        {activeTab === 'capture' ? (
          <section className="screen-stack" aria-label="Capture flow">
            <article className="feature-card spotlight">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Flow 1</span>
                  <h3>ถ่ายรูปส่งใน LINE แล้วให้ AI อ่านก่อนยืนยัน</h3>
                </div>
                <span className="confidence-badge">OCR confidence 92%</span>
              </div>

              <div className="receipt-preview">
                <div className="receipt-topline">
                  <span>Makro Receipt</span>
                  <span>11/06/2026 11:42</span>
                </div>
                <dl className="receipt-grid">
                  <div>
                    <dt>ร้านค้า</dt>
                    <dd>Makro</dd>
                  </div>
                  <div>
                    <dt>ยอดเงิน</dt>
                    <dd>฿1,250</dd>
                  </div>
                  <div>
                    <dt>ประเภท</dt>
                    <dd>รายจ่าย</dd>
                  </div>
                  <div>
                    <dt>รูปต้นฉบับ</dt>
                    <dd>Drive linked</dd>
                  </div>
                </dl>
              </div>

              <div className="category-block">
                <p>เลือกหมวดหมู่ก่อนส่ง draft ไปยืนยันใน LINE</p>
                <div className="chip-group">
                  {captureCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={captureCategory === category.id ? 'chip active' : 'chip'}
                      onClick={() => setCaptureCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cta-row">
                <button type="button" className="primary-button">
                  ส่ง draft ยืนยัน
                </button>
                <button type="button" className="secondary-button">
                  แก้ไขตัวเลข
                </button>
              </div>
            </article>

            <article className="feature-card compact">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Realtime path</span>
                  <h3>สิ่งที่จะเกิดหลังผู้ใช้ส่งรูป</h3>
                </div>
              </div>
              <ol className="timeline-list">
                <li>Webhook รับ event แล้วตอบกลับทันทีว่า “กำลังอ่านสลิป...”</li>
                <li>background worker ดึงรูปจาก LINE แล้วอัปขึ้น Google Drive</li>
                <li>OpenAI แยก `วันที่`, `ร้านค้า`, `ยอด`, `ประเภทเอกสาร`</li>
                <li>บอท push Flex draft เพื่อให้ user กด `ยืนยัน` หรือ `แก้ไข`</li>
              </ol>
            </article>

            <footer className="sticky-summary">
              <div>
                <span className="section-kicker">Ready to save</span>
                <strong>{captureCategoryLabel}</strong>
              </div>
              <span>จะบันทึกลง Sheet + เก็บรูปใน Drive</span>
            </footer>
          </section>
        ) : null}

        {activeTab === 'entry' ? (
          <section className="screen-stack" aria-label="Text entry flow">
            <article className="feature-card spotlight">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Flow 2</span>
                  <h3>พิมพ์ข้อความแล้วให้ AI จัดโครงข้อมูลเป็น ledger draft</h3>
                </div>
                <span className="confidence-badge">Thai parse 96%</span>
              </div>

              <div className="entry-type-toggle" role="tablist" aria-label="Entry type">
                <button
                  type="button"
                  className={entryType === 'income' ? 'active' : ''}
                  onClick={() => setEntryType('income')}
                >
                  รายรับ
                </button>
                <button
                  type="button"
                  className={entryType === 'expense' ? 'active' : ''}
                  onClick={() => setEntryType('expense')}
                >
                  รายจ่าย
                </button>
              </div>

              <div className="message-preview">
                <p className="message-label">ตัวอย่างข้อความจาก LINE</p>
                <div className="bubble inbound">{selectedExample}</div>
              </div>

              <div className="chip-group">
                {textExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className={selectedExample === example ? 'chip active' : 'chip'}
                    onClick={() => setSelectedExample(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>

              <div className="draft-panel">
                <div className="draft-row">
                  <span>จำนวนเงิน</span>
                  <strong>{selectedExample.includes('3,500') ? '฿3,500' : '฿1,200'}</strong>
                </div>
                <div className="draft-row">
                  <span>ประเภท</span>
                  <strong>{entryType === 'income' ? 'รายรับ' : 'รายจ่าย'}</strong>
                </div>
                <div className="draft-row">
                  <span>หมวดหมู่</span>
                  <strong>{textCategoryLabel}</strong>
                </div>
                <div className="draft-row">
                  <span>รายละเอียด</span>
                  <strong>{selectedExample}</strong>
                </div>
              </div>

              <div className="category-block">
                <p>ตัวเลือกหมวดหมู่แบบ mobile-first ให้กดแก้ได้ด้วยนิ้วเดียว</p>
                <div className="chip-group">
                  {textCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={textCategory === category.id ? 'chip active income' : 'chip income'}
                      onClick={() => setTextCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <footer className="sticky-summary">
              <div>
                <span className="section-kicker">Confirm draft</span>
                <strong>{entryType === 'income' ? 'พร้อมบันทึกรายรับ' : 'พร้อมบันทึกรายจ่าย'}</strong>
              </div>
              <button type="button" className="primary-button narrow">
                ยืนยันและบันทึก
              </button>
            </footer>
          </section>
        ) : null}

        {activeTab === 'summary' ? (
          <section className="screen-stack" aria-label="Daily summary flow">
            <article className="feature-card spotlight">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Flow 3</span>
                  <h3>สรุปรายวันก่อน push เข้า LINE เวลา 00:30</h3>
                </div>
                <span className="confidence-badge">Asia/Bangkok</span>
              </div>

              <div className="summary-grid">
                {summaryCards.map((card) => (
                  <article key={card.label} className={`summary-tile ${card.tone}`}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.delta}</small>
                  </article>
                ))}
              </div>
            </article>

            <article className="feature-card compact">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Feed preview</span>
                  <h3>รายการที่ใช้คำนวณสรุป</h3>
                </div>
              </div>

              <ul className="activity-list">
                {summaryFeed.map((item) => (
                  <li key={`${item.time}-${item.title}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.meta}</p>
                    </div>
                    <div className="activity-meta">
                      <span>{item.amount}</span>
                      <small>{item.time}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <footer className="sticky-summary">
              <div>
                <span className="section-kicker">Push payload</span>
                <strong>“สรุปวันที่ 11/06/2026”</strong>
              </div>
              <span>รายรับ 12,500 • รายจ่าย 4,300 • คงเหลือ 8,200</span>
            </footer>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default App
