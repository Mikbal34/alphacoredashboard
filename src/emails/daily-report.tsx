import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components"

interface Transaction {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  description: string
  date: Date
  category: {
    name: string
    color: string
  }
}

interface DailyReportEmailProps {
  date: Date
  summary: {
    income: number
    expense: number
    net: number
  }
  transactions: Transaction[]
  completedTasksCount: number
}

export function DailyReportEmail({
  date,
  summary,
  transactions,
  completedTasksCount,
}: DailyReportEmailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Günlük Rapor</Heading>
          <Text style={text}>
            {date.toLocaleDateString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          <Hr style={hr} />

          <Section style={summarySection}>
            <Heading style={h2}>Finansal Özet</Heading>

            <div style={summaryGrid}>
              <div style={summaryCard}>
                <Text style={summaryLabel}>Gelir</Text>
                <Text style={{ ...summaryValue, color: "#10b981" }}>
                  {formatCurrency(summary.income)}
                </Text>
              </div>

              <div style={summaryCard}>
                <Text style={summaryLabel}>Gider</Text>
                <Text style={{ ...summaryValue, color: "#ef4444" }}>
                  {formatCurrency(summary.expense)}
                </Text>
              </div>

              <div style={summaryCard}>
                <Text style={summaryLabel}>Net</Text>
                <Text
                  style={{
                    ...summaryValue,
                    color: summary.net >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {formatCurrency(summary.net)}
                </Text>
              </div>
            </div>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading style={h2}>Tamamlanan Görevler</Heading>
            <Text style={text}>
              Bugün <strong>{completedTasksCount}</strong> görev tamamlandı.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading style={h2}>Bugünün İşlemleri</Heading>
            {transactions.length === 0 ? (
              <Text style={text}>Bugün hiç işlem yapılmadı.</Text>
            ) : (
              <div style={transactionList}>
                {transactions.map((transaction) => (
                  <div key={transaction.id} style={transactionItem}>
                    <div style={transactionHeader}>
                      <Text style={transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text
                        style={{
                          ...transactionAmount,
                          color:
                            transaction.type === "INCOME" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </div>
                    <Text style={transactionCategory}>
                      {transaction.category.name}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Bu rapor otomatik olarak oluşturulmuştur. AlphaCore Dashboard
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default DailyReportEmail

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const h1 = {
  color: "#1f2937",
  fontSize: "32px",
  fontWeight: "700",
  margin: "40px 0 20px",
  padding: "0 40px",
}

const h2 = {
  color: "#374151",
  fontSize: "24px",
  fontWeight: "600",
  margin: "20px 0 12px",
  padding: "0 40px",
}

const text = {
  color: "#6b7280",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
  padding: "0 40px",
}

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const summarySection = {
  padding: "0 40px",
}

const summaryGrid = {
  display: "flex",
  gap: "16px",
  marginTop: "16px",
  flexWrap: "wrap" as const,
}

const summaryCard = {
  flex: "1",
  minWidth: "150px",
  padding: "16px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
}

const summaryLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 8px",
}

const summaryValue = {
  fontSize: "24px",
  fontWeight: "700",
  margin: "0",
}

const transactionList = {
  padding: "0 40px",
}

const transactionItem = {
  padding: "12px 0",
  borderBottom: "1px solid #e5e7eb",
}

const transactionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "4px",
}

const transactionDescription = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
}

const transactionAmount = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
}

const transactionCategory = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "0",
}

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  textAlign: "center" as const,
  marginTop: "32px",
  padding: "0 40px",
}
