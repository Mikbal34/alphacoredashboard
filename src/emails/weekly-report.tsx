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

interface WeeklyReportEmailProps {
  weekStart: Date
  weekEnd: Date
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
}

export function WeeklyReportEmail({
  weekStart,
  weekEnd,
  financialSummary,
  taskStatistics,
  topCategories,
  transactionsCount,
}: WeeklyReportEmailProps) {
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

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Haftalık Rapor</Heading>
          <Text style={text}>
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </Text>

          <Hr style={hr} />

          <Section style={summarySection}>
            <Heading style={h2}>Finansal Özet</Heading>

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
              Bu hafta toplam <strong>{transactionsCount}</strong> işlem yapıldı.
            </Text>
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
                Tamamlanma oranı:{" "}
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
            <Heading style={h2}>En Çok Harcama Yapılan Kategoriler</Heading>

            {topCategories.length === 0 ? (
              <Text style={text}>Bu hafta hiç gider kategorisi yok.</Text>
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
              <Heading style={h3}>Haftalık İçgörüler</Heading>
              <Text style={insightText}>
                {financialSummary.net >= 0
                  ? `Bu hafta ${formatCurrency(financialSummary.net)} pozitif bakiye elde ettiniz. Harika iş!`
                  : `Bu hafta ${formatCurrency(Math.abs(financialSummary.net))} negatif bakiyeye sahipsiniz. Gelirlerinizi artırmayı veya giderlerinizi azaltmayı düşünebilirsiniz.`}
              </Text>
              <Text style={insightText}>
                {taskStatistics.total > 0
                  ? `${taskStatistics.completed} görev tamamladınız. ${taskStatistics.inProgress} görev hala devam ediyor.`
                  : "Bu hafta hiç görev oluşturulmadı."}
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

export default WeeklyReportEmail

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
  backgroundColor: "#3b82f6",
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
  backgroundColor: "#eff6ff",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #3b82f6",
}

const insightText = {
  color: "#1e40af",
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
