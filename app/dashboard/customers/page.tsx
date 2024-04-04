
import { fetchCustomersPage, fetchFilteredCustomers } from '@/app/lib/data';
import { CreateCustomer } from '@/app/ui/customers/buttons';
import CustomersTable from '@/app/ui/customers/table';
import { lusitana } from '@/app/ui/fonts';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';

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
  const totalPages = await fetchCustomersPage(query);
  const customers = await fetchFilteredCustomers(query, currentPage);
 
 console.log("customers", customers)
  return (    <div className="w-full">
  <div className="flex w-full items-center justify-between">
    <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
  </div>
  <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
    <Search placeholder="Search invoices..." />
    <CreateCustomer />
  </div>
  <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
  <CustomersTable customers={customers.map(customer => ({
      ...customer,
      total_pending: Number(customer.total_pending) //Convert to number
    }))}/>
  </Suspense>
  <div className="mt-5 flex w-full justify-center">
    <Pagination totalPages={totalPages} />
  </div>
</div>
  
  );
}