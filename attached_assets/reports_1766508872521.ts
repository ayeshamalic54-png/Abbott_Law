import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ProgramFeeData {
  programId: string | null;
  programName: string;
  programType: 'group' | 'law' | 'unknown';
  totalCollected: number;
}

export interface ExpenseData {
  id: string;
  date: string;
  headId: string | null;
  amount: number;
  description: string | null;
}

export interface FeeReportBreakdown {
  programId: string | null;
  programName: string;
  programType: 'group' | 'law' | 'unknown';
  grossCollected: number;
  expensesApplied: number;
  netCollected: number;
}

export interface FeeReportSummary {
  totalFees: number;
  totalGroupFees: number;
  totalLawFees: number;
  totalExpenses: number;
  appliedExpenses: number;
  unappliedExpenses: number;
  expensesAppliedTo: 'group' | 'law' | 'none';
  netIncome: number;
}

export interface FeeReportResponse {
  summary: FeeReportSummary;
  breakdown: FeeReportBreakdown[];
  expenses: ExpenseData[];
  dateRange: {
    start: string;
    end: string;
    period: ReportPeriod;
  };
}

/**
 * Calculate date range based on period
 * - daily: today (00:00:00 to 23:59:59)
 * - weekly: ISO week (Monday to Sunday)
 * - monthly: calendar month
 * - yearly: calendar year
 */
export function getDateRange(period: ReportPeriod, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  
  // If custom dates provided, use them
  if (customStart && customEnd) {
    return {
      start: startOfDay(new Date(customStart)),
      end: endOfDay(new Date(customEnd)),
    };
  }
  
  // Otherwise calculate based on period
  switch (period) {
    case 'daily':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'weekly':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(now, { weekStartsOn: 1 }), // Sunday
      };
    case 'monthly':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'yearly':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * Smart expense deduction algorithm:
 * 1. If group fees collected > 0: deduct from group fees
 * 2. Else if only law fees collected: deduct from law fees
 * 3. Else: no deduction (no fees collected)
 * 
 * Clamp applied expenses so no program type goes negative
 */
export function calculateFeeReport(
  programFees: ProgramFeeData[],
  expenses: ExpenseData[],
  period: ReportPeriod,
  startDate: string,
  endDate: string
): FeeReportResponse {
  // Calculate totals by program type
  let totalGroupFees = 0;
  let totalLawFees = 0;
  let totalUnknownFees = 0;
  
  programFees.forEach(pf => {
    if (pf.programType === 'group') {
      totalGroupFees += pf.totalCollected;
    } else if (pf.programType === 'law') {
      totalLawFees += pf.totalCollected;
    } else {
      totalUnknownFees += pf.totalCollected;
    }
  });
  
  const totalFees = totalGroupFees + totalLawFees + totalUnknownFees;
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  
  // Determine where to apply expenses
  let expensesAppliedTo: 'group' | 'law' | 'none';
  let groupExpenses = 0;
  let lawExpenses = 0;
  
  if (totalGroupFees > 0) {
    // Apply to group fees, clamp at zero
    expensesAppliedTo = 'group';
    groupExpenses = Math.min(totalExpenses, totalGroupFees);
  } else if (totalLawFees > 0) {
    // Only law fees collected, apply to law
    expensesAppliedTo = 'law';
    lawExpenses = Math.min(totalExpenses, totalLawFees);
  } else {
    // No fees collected
    expensesAppliedTo = 'none';
  }
  
  // Calculate actually applied expenses (may be less than total if clamped)
  const appliedExpenses = groupExpenses + lawExpenses;
  const unappliedExpenses = totalExpenses - appliedExpenses;
  
  // Calculate net income using only applied expenses
  const netIncome = totalFees - appliedExpenses;
  
  // Build breakdown
  const breakdown: FeeReportBreakdown[] = programFees.map(pf => {
    let expensesApplied = 0;
    
    if (pf.programType === 'group' && expensesAppliedTo === 'group') {
      // Proportionally distribute group expenses among group programs
      const proportion = totalGroupFees > 0 ? pf.totalCollected / totalGroupFees : 0;
      expensesApplied = groupExpenses * proportion;
    } else if (pf.programType === 'law' && expensesAppliedTo === 'law') {
      // Proportionally distribute law expenses among law programs
      const proportion = totalLawFees > 0 ? pf.totalCollected / totalLawFees : 0;
      expensesApplied = lawExpenses * proportion;
    }
    // Unknown programs never get expenses applied
    
    return {
      programId: pf.programId,
      programName: pf.programName,
      programType: pf.programType,
      grossCollected: pf.totalCollected,
      expensesApplied: Math.round(expensesApplied * 100) / 100, // Round to 2 decimals
      netCollected: pf.totalCollected - expensesApplied,
    };
  });
  
  return {
    summary: {
      totalFees: Math.round(totalFees * 100) / 100,
      totalGroupFees: Math.round(totalGroupFees * 100) / 100,
      totalLawFees: Math.round(totalLawFees * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      appliedExpenses: Math.round(appliedExpenses * 100) / 100,
      unappliedExpenses: Math.round(unappliedExpenses * 100) / 100,
      expensesAppliedTo,
      netIncome: Math.round(netIncome * 100) / 100,
    },
    breakdown,
    expenses,
    dateRange: {
      start: startDate,
      end: endDate,
      period,
    },
  };
}
