// ─── Employees ─────────────────────────────────────────────
export type EmployeeRole =
  | "Manager"
  | "Supervisor"
  | "Cleaner"
  | "Security"
  | "Maintenance"
  | string; // API accepts free-form

export interface Employee {
  id: number;
  name: string;
  role: string;
  monthly_salary: string; // "5000.00"
  joining_date: string;   // YYYY-MM-DD
  is_active: boolean;
}

export interface EmployeePayload {
  name: string;
  role: string;
  monthly_salary: string;
  joining_date: string;
  is_active?: boolean;
}

// ─── Attendance ────────────────────────────────────────────
export type AttendanceStatus = "present" | "half_day" | "absent";

export interface AttendanceRecord {
  id: number;
  employee_id?: number;
  employee_name?: string;
  date: string;
  status: AttendanceStatus;
}

export interface BulkAttendancePayload {
  date: string; // YYYY-MM-DD
  records: { id: number; status: AttendanceStatus }[];
}

// ─── Salary Report ─────────────────────────────────────────
export interface SalaryReportRow {
  employee_id: number;
  employee_name: string;
  role: string;
  monthly_salary: string;
  days_present: number;
  days_half: number;
  days_absent: number;
  payable_salary: string;
}

// ─── Expenses ──────────────────────────────────────────────
export interface Expense {
  id: number;
  purpose: string;
  amount: string;
  date: string;       // YYYY-MM-DD
  notes: string;
  created_at: string;
}

export interface ExpensePayload {
  purpose: string;
  amount: string;
  date: string;
  notes?: string;
}

// ─── Expense Dashboard ─────────────────────────────────────
export interface ExpenseDashboardSummary {
  revenue: string;
  total_custom_expenses: string;
  total_salary_expenses: string;
  grand_total_expenses: string;
  net_profit: string;
}

export interface ExpenseDashboardData {
  summary: ExpenseDashboardSummary;
  salary_breakdown: SalaryReportRow[];
  expense_breakdown: Expense[];
}

// ─── Common ────────────────────────────────────────────────
export interface ManagementResponse<T> {
  result: "success" | "error";
  message: string;
  data: T;
}