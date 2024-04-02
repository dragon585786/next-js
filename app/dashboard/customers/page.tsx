
import { fetchFilteredCustomers } from '@/app/lib/data';
import CustomersTable from '@/app/ui/customers/table';

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
 const customers = await fetchFilteredCustomers(query);
 console.log("customers", customers)
  return (
    <CustomersTable customers={customers.map(customer => ({
      ...customer,
      total_pending: Number(customer.total_pending) // Convert to number
    }))}/>
  );
}