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

interface MonthlyReportEmailProps {
  monthStart: Date
  monthEnd: Date
  financialSummary: {
    income: number
    expense: number
    net: number
  }
  taskStatistics: {
    completed: number
    inProgress: number
    total: number
  }
  topCategories: Array<{
    name: string
    amount: number
  }>
  transactionsCount: number
  previousMonthNet: number | null
}

export function MonthlyReportEmail({
  monthStart,
  monthEnd,
  financialSummary,
  taskStatistics,
  topCategories,
  transactionsCount,
  previousMonthNet,
}: MonthlyReportEmailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const monthName = monthStart.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  })

  const changePercent =
    previousMonthNet !== null && previousMonthNet !== 0
      ? ((financialSummary.net - previousMonthNet) / Math.abs(previousMonthNet)) * 100
      : null

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Aylık Rapor</Heading>
          <Text style={text}>
            {formatDate(monthStart)} - {formatDate(monthEnd)}
          </Text>

          <Hr style={hr} />

          <Section style={summarySection}>
            <Heading style={h2}>Finansal Özet — {monthName}</Heading>

            <div style={summaryGrid}>
              <div style={summaryCard}>
                <Text style={summaryLabel}>Toplam Gelir</Text>
                <Text style={{ ...summaryValue, color: "#10b981" }}>
                  {formatCurrency(financialSummary.income)}
                </Text>
              </div>

              <div style={summaryCard}>
                <Text style={summaryLabel}>Toplam Gider</Text>
                <Text style={{ ...summaryValue, color: "#ef4444" }}>
                  {formatCurrency(financialSummary.expense)}
                </Text>
              </div>

              <div style={summaryCard}>
                <Text style={summaryLabel}>Net Bakiye</Text>
                <Text
                  style={{
                    ...summaryValue,
                    color: financialSummary.net >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {formatCurrency(financialSummary.net)}
                </Text>
              </div>
            </div>

            <Text style={{ ...text, marginTop: "16px" }}>
              Bu ay toplam <strong>{transactionsCount}</strong> işlem yapıldı.
            </Text>

            {changePercent !== null && (
              <Text style={{ ...text, marginTop: "4px" }}>
                Geçen aya göre net bakiye{" "}
                <strong style={{ color: changePercent >= 0 ? "#10b981" : "#ef4444" }}>
                  {changePercent >= 0 ? "+" : ""}
                  {changePercent.toFixed(1)}%
                </strong>{" "}
                değişti.
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={summarySection}>
            <Heading style={h2}>Görev İstatistikleri</Heading>

            <div style={statsGrid}>
              <div style={statItem}>
                <Text style={statValue}>{taskStatistics.total}</Text>
                <Text style={statLabel}>Toplam Görev</Text>
              </div>

              <div style={statItem}>
                <Text style={{ ...statValue, color: "#10b981" }}>
                  {taskStatistics.completed}
                </Text>
                <Text style={statLabel}>Tamamlanan</Text>
              </div>

              <div style={statItem}>
                <Text style={{ ...statValue, color: "#3b82f6" }}>
                  {taskStatistics.inProgress}
                </Text>
                <Text style={statLabel}>Devam Eden</Text>
              </div>

              <div style={statItem}>
                <Text style={{ ...statValue, color: "#6b7280" }}>
                  {taskStatistics.total -
                    taskStatistics.completed -
                    taskStatistics.inProgress}
                </Text>
                <Text style={statLabel}>Bekleyen</Text>
              </div>
            </div>

            {taskStatistics.total > 0 && (
              <Text style={{ ...text, marginTop: "16px" }}>
                Aylık tamamlanma oranı:{" "}
                <strong>
                  {Math.round(
                    (taskStatistics.completed / taskStatistics.total) * 100
                  )}
                  %
                </strong>
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={summarySection}>
            <Heading style={h2}>Kategori Analizi</Heading>

            {topCategories.length === 0 ? (
              <Text style={text}>Bu ay hiç gider kategorisi yok.</Text>
            ) : (
              <div style={categoryList}>
                {topCategories.map((category, index) => (
                  <div key={category.name} style={categoryItem}>
                    <div style={categoryRank}>{index + 1}</div>
                    <div style={categoryInfo}>
                      <Text style={categoryName}>{category.name}</Text>
                      <Text style={categoryAmount}>
                        {formatCurrency(category.amount)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={summarySection}>
            <div style={insightBox}>
              <Heading style={h3}>Aylık Değerlendirme</Heading>
              <Text style={insightText}>
                {financialSummary.net >= 0
                  ? `${monthName} ayında ${formatCurrency(financialSummary.net)} pozitif bakiye elde ettiniz. Harika iş!`
                  : `${monthName} ayında ${formatCurrency(Math.abs(financialSummary.net))} negatif bakiyeye sahipsiniz. Bütçenizi gözden geçirmenizi öneririz.`}
              </Text>
              <Text style={insightText}>
                {taskStatistics.total > 0
                  ? `${taskStatistics.completed} görev tamamlandı, ${taskStatistics.total - taskStatistics.completed} görev açık durumda.`
                  : "Bu ay hiç görev oluşturulmadı."}
              </Text>
            </div>
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

export default MonthlyReportEmail

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

const h3 = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
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

const statsGrid = {
  display: "flex",
  gap: "12px",
  marginTop: "16px",
  flexWrap: "wrap" as const,
}

const statItem = {
  flex: "1",
  minWidth: "100px",
  textAlign: "center" as const,
  padding: "12px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
}

const statValue = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 4px",
}

const statLabel = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
}

const categoryList = {
  marginTop: "16px",
}

const categoryItem = {
  display: "flex",
  alignItems: "center",
  padding: "12px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "8px",
}

const categoryRank = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  backgroundColor: "#8b5cf6",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  fontSize: "14px",
  marginRight: "12px",
  flexShrink: 0,
}

const categoryInfo = {
  flex: "1",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}

const categoryName = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
}

const categoryAmount = {
  color: "#ef4444",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
}

const insightBox = {
  backgroundColor: "#f5f3ff",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #8b5cf6",
}

const insightText = {
  color: "#5b21b6",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 12px",
  padding: "0",
}

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  textAlign: "center" as const,
  marginTop: "32px",
  padding: "0 40px",
}
