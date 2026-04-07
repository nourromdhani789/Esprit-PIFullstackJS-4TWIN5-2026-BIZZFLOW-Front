import { GROQ_API_KEY, GROQ_API_URL } from './ai.service';

export interface ReportData {
  period?: string;
  totalSales?: number;
  totalExpenses?: number;
  invoiceCount?: number;
  paidInvoices?: number;
  unpaidInvoices?: number;
  topClients?: Array<{ name: string; total: number }>;
  topProducts?: Array<{ name: string; revenue: number }>;
  comparisonData?: {
    previousPeriodSales?: number;
    previousPeriodExpenses?: number;
    growthRate?: number;
  };
}

export interface GeneratedReport {
  title: string;
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  detailedAnalysis: string;
  generatedAt: Date;
}

class AIReportGeneratorService {
  async generateReport(data: ReportData): Promise<GeneratedReport> {
    // If no API key, use rule-based generation
    if (!GROQ_API_KEY) {
      return this.generateFallbackReport(data);
    }

    try {
      const prompt = this.buildPrompt(data);
      
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a business report generator. Create professional, concise business reports from structured data. Output must be valid JSON with fields: title, summary, keyInsights (array), recommendations (array), detailedAnalysis.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || 'Business Report',
          summary: parsed.summary || '',
          keyInsights: parsed.keyInsights || [],
          recommendations: parsed.recommendations || [],
          detailedAnalysis: parsed.detailedAnalysis || '',
          generatedAt: new Date(),
        };
      }

      return this.generateFallbackReport(data);
    } catch (error) {
      console.error('AI Report generation error:', error);
      return this.generateFallbackReport(data);
    }
  }

  private buildPrompt(data: ReportData): string {
    const { 
      period, totalSales, totalExpenses, invoiceCount, 
      paidInvoices, unpaidInvoices, topClients, topProducts,
      comparisonData 
    } = data;

    let prompt = `Generate a business report from the following data:\n\n`;
    
    if (period) prompt += `Period: ${period}\n`;
    if (totalSales !== undefined) prompt += `Total Sales: ${totalSales.toFixed(3)} TND\n`;
    if (totalExpenses !== undefined) prompt += `Total Expenses: ${totalExpenses.toFixed(3)} TND\n`;
    if (invoiceCount !== undefined) prompt += `Total Invoices: ${invoiceCount}\n`;
    if (paidInvoices !== undefined) prompt += `Paid Invoices: ${paidInvoices}\n`;
    if (unpaidInvoices !== undefined) prompt += `Unpaid Invoices: ${unpaidInvoices}\n`;
    
    if (topClients?.length) {
      prompt += `\nTop Clients:\n`;
      topClients.forEach((client, i) => {
        prompt += `${i + 1}. ${client.name}: ${client.total.toFixed(3)} TND\n`;
      });
    }

    if (topProducts?.length) {
      prompt += `\nTop Products:\n`;
      topProducts.forEach((product, i) => {
        prompt += `${i + 1}. ${product.name}: ${product.revenue.toFixed(3)} TND\n`;
      });
    }

    if (comparisonData) {
      prompt += `\nComparison with previous period:\n`;
      if (comparisonData.previousPeriodSales !== undefined) {
        prompt += `Previous Sales: ${comparisonData.previousPeriodSales.toFixed(3)} TND\n`;
      }
      if (comparisonData.growthRate !== undefined) {
        const growth = comparisonData.growthRate > 0 ? '+' : '';
        prompt += `Growth Rate: ${growth}${comparisonData.growthRate.toFixed(1)}%\n`;
      }
    }

    const netProfit = (totalSales || 0) - (totalExpenses || 0);
    prompt += `\nNet Profit/Loss: ${netProfit.toFixed(3)} TND\n`;

    prompt += `\nGenerate a JSON object with these fields: title, summary (2-3 sentences), keyInsights (array of 3-5 strings), recommendations (array of 2-4 strings), detailedAnalysis (1 paragraph).`;

    return prompt;
  }

  private generateFallbackReport(data: ReportData): GeneratedReport {
    const { 
      period, totalSales, totalExpenses, invoiceCount, 
      paidInvoices, unpaidInvoices, topClients, comparisonData 
    } = data;

    const keyInsights: string[] = [];
    const recommendations: string[] = [];

    // Sales analysis
    if (comparisonData?.growthRate !== undefined) {
      const direction = comparisonData.growthRate > 0 ? 'increased' : 'decreased';
      keyInsights.push(`Sales have ${direction} by ${Math.abs(comparisonData.growthRate).toFixed(1)}% compared to the previous period.`);
    }

    // Payment status
    if (unpaidInvoices && paidInvoices) {
      const total = unpaidInvoices + paidInvoices;
      const unpaidRate = (unpaidInvoices / total) * 100;
      if (unpaidRate > 30) {
        keyInsights.push(`${unpaidRate.toFixed(0)}% of invoices are unpaid. Consider improving collection efforts.`);
        recommendations.push('Send payment reminders to clients with outstanding balances.');
      } else {
        keyInsights.push('Payment collection is healthy with most invoices paid on time.');
      }
    }

    // Top clients
    if (topClients?.length) {
      keyInsights.push(`Top client is ${topClients[0].name} with ${topClients[0].total.toFixed(3)} TND in business.`);
    }

    // Profitability
    const netProfit = (totalSales || 0) - (totalExpenses || 0);
    if (netProfit > 0) {
      keyInsights.push(`Business is profitable with a net profit of ${netProfit.toFixed(3)} TND.`);
    } else if (netProfit < 0) {
      keyInsights.push(`Business recorded a loss of ${Math.abs(netProfit).toFixed(3)} TND. Review expenses.`);
      recommendations.push('Analyze expense categories to identify cost reduction opportunities.');
    }

    // Default recommendations
    if (recommendations.length < 2) {
      recommendations.push('Continue monitoring key performance indicators.');
      recommendations.push('Follow up with clients for any pending payments.');
    }

    const summary = period 
      ? `For ${period}, total sales were ${(totalSales || 0).toFixed(3)} TND with ${invoiceCount || 0} invoices. ${netProfit >= 0 ? 'The business is profitable' : 'The business recorded a loss'} with a net ${netProfit >= 0 ? 'profit' : 'loss'} of ${Math.abs(netProfit).toFixed(3)} TND.`
      : `Total sales were ${(totalSales || 0).toFixed(3)} TND across ${invoiceCount || 0} invoices. ${netProfit >= 0 ? 'The business is profitable' : 'The business recorded a loss'} with a net ${netProfit >= 0 ? 'profit' : 'loss'} of ${Math.abs(netProfit).toFixed(3)} TND.`;

    return {
      title: period ? `Business Report - ${period}` : 'Business Performance Report',
      summary,
      keyInsights,
      recommendations,
      detailedAnalysis: summary,
      generatedAt: new Date(),
    };
  }

  async generateSalesReport(
    invoices: Array<{ total: number; status: string; createdAt: string; clientName?: string }>,
    period: string
  ): Promise<GeneratedReport> {
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'pending').length;
    
    // Calculate top clients
    const clientTotals: Record<string, number> = {};
    invoices.forEach(inv => {
      const name = inv.clientName || 'Unknown';
      clientTotals[name] = (clientTotals[name] || 0) + (inv.total || 0);
    });
    
    const topClients = Object.entries(clientTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }));

    return this.generateReport({
      period,
      totalSales,
      invoiceCount: invoices.length,
      paidInvoices,
      unpaidInvoices,
      topClients,
    });
  }
}

export const aiReportGenerator = new AIReportGeneratorService();
export default aiReportGenerator;
