import client from "../admin/client";
import type {
  Employee,
  EmployeePayload,
  AttendanceRecord,
  BulkAttendancePayload,
  SalaryReportRow,
  Expense,
  ExpensePayload,
  ExpenseDashboardData,
  ManagementResponse,
} from "../../types/partner/management";

const BASE = "/api/partner/partner-management";

const buildParams = (obj: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
};

export const partnerManagementApi = {
  // ─── Employees ─────────────────────────────────────────
  listEmployees: async (isActive: boolean = true) => {
    const { data } = await client.get<ManagementResponse<Employee[]>>(
      `${BASE}/employees/`,
      { params: { is_active: isActive } },
    );
    return data;
  },

  addEmployee: async (payload: EmployeePayload) => {
    const { data } = await client.post<ManagementResponse<Employee>>(
      `${BASE}/employees/add/`,
      payload,
    );
    return data;
  },

  updateEmployee: async (id: number, payload: Partial<EmployeePayload>) => {
    const { data } = await client.patch<ManagementResponse<Employee>>(
      `${BASE}/${id}/employees/update/`,
      payload,
    );
    return data;
  },

  deleteEmployee: async (id: number) => {
    const { data } = await client.delete<ManagementResponse<[]>>(
      `${BASE}/${id}/employees/delete/`,
    );
    return data;
  },

  // ─── Attendance ────────────────────────────────────────
  getAttendance: async (date: string) => {
    const { data } = await client.get<ManagementResponse<AttendanceRecord[]>>(
      `${BASE}/attendance/`,
      { params: { date } },
    );
    return data;
  },

  markBulkAttendance: async (payload: BulkAttendancePayload) => {
    const { data } = await client.post<ManagementResponse<[]>>(
      `${BASE}/attendance/bulk/`,
      payload,
    );
    return data;
  },

  // ─── Salary ────────────────────────────────────────────
  getSalaryReport: async (month: number, year: number) => {
    const { data } = await client.get<ManagementResponse<SalaryReportRow[]>>(
      `${BASE}/salary-report/`,
      { params: buildParams({ month, year }) },
    );
    return data;
  },

  // ─── Expenses ──────────────────────────────────────────
  listExpenses: async (startDate?: string, endDate?: string) => {
    const { data } = await client.get<ManagementResponse<Expense[]>>(
      `${BASE}/expenses/`,
      { params: buildParams({ start_date: startDate, end_date: endDate }) },
    );
    return data;
  },

  addExpense: async (payload: ExpensePayload) => {
    const { data } = await client.post<ManagementResponse<Expense>>(
      `${BASE}/expenses/add/`,
      payload,
    );
    return data;
  },

  // ─── Dashboard ─────────────────────────────────────────
  getExpenseDashboard: async (month: number, year: number) => {
    const { data } = await client.get<ManagementResponse<ExpenseDashboardData>>(
      `${BASE}/expenses/dashboard/`,
      { params: buildParams({ month, year }) },
    );
    return data;
  },
};

// ─── Constants ─────────────────────────────────────────────
export const EMPLOYEE_ROLES = [
  "Manager",
  "Supervisor",
  "Cleaner",
  "Security",
  "Maintenance",
];

export const ATTENDANCE_STATUSES: {
  value: "present" | "half_day" | "absent";
  label: string;
}[] = [
  { value: "present", label: "Present" },
  { value: "half_day", label: "Half Day" },
  { value: "absent", label: "Absent" },
];