# Krisphy (Somjeed AI) — Receipt & Ledger Tracking

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![LINE API](https://img.shields.io/badge/LINE_API-00C300?style=for-the-badge&logo=line&logoColor=white)
![Fintech](https://img.shields.io/badge/Domain-Fintech-0ea5e9?style=for-the-badge)

> **Snap a receipt → auto expense log.** LINE-integrated receipt tracking for Thai SMEs.

### Demo

![Demo](https://via.placeholder.com/1280x640/0f172a/38bdf8?text=Krisphy+—+Receipt+Tracking+Demo+—+Add+docs/demo.gif)

### Architecture

```mermaid
graph LR
  A[LINE Message] --> B[LINE Webhook]
  B --> C[Receipt OCR Parser]
  C --> D[(Ledger DB)]
  D --> E[Auto Expense Reports]
```

### Results

| Metric | Value |
|---|---|
| **Integration** | LINE API native |
| **Automation** | Receipt → ledger, zero manual entry |


---

**Phirawit Jitnarong — Strategic Full-Stack & AI Engineer**

xme176@gmail.com · 092-551-0427 · [LinkedIn](https://www.linkedin.com/in/%E0%B8%9E%E0%B8%B5%E0%B8%A3%E0%B8%A7%E0%B8%B4%E0%B8%8A%E0%B8%8D%E0%B9%8C-%E0%B8%88%E0%B8%B4%E0%B8%95%E0%B8%93%E0%B8%A3%E0%B8%87%E0%B8%84%E0%B9%8C-0000393a4) · [Fastwork](https://fastwork.co/user/bravforcode?source=search)

> Hiring for this stack? Let's talk — production hardened, 300k+ users shipped.