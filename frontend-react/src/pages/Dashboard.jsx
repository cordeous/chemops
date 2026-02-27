import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import AdminDashboard from './dashboards/AdminDashboard';
import SalesDashboard from './dashboards/SalesDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';
import ComplianceDashboard from './dashboards/ComplianceDashboard';

const ROLE_SUBTITLES = {
  Admin: 'Full system overview',
  Sales: 'Orders, customers & revenue',
  Finance: 'Invoices, payments & margins',
  Compliance: 'SDS tracker & customer compliance',
};

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? 'Sales';
  const subtitle = ROLE_SUBTITLES[role] ?? '';

  return (
    <Layout title={`${role} Dashboard`} subtitle={subtitle}>
      {role === 'Admin'      && <AdminDashboard />}
      {role === 'Sales'      && <SalesDashboard />}
      {role === 'Finance'    && <FinanceDashboard />}
      {role === 'Compliance' && <ComplianceDashboard />}
    </Layout>
  );
}
