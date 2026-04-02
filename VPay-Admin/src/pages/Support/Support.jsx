import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiSearch } from 'react-icons/fi';
import { supportService } from '../../services';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import SelectInput from '../../components/common/SelectInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import { SUPPORT_STATUSES, SUPPORT_PRIORITIES } from '../../utils/constants';

const Support = () => {
  const [filters, setFilters] = useState({ status: 'open' });

  const { data, isLoading } = useQuery(
    ['support-tickets', filters],
    () => supportService.getTickets(filters)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Support</h1>
        <p className="text-gray-600 mt-1">Manage customer support tickets and inquiries</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input placeholder="Search tickets..." icon={<FiSearch />} />
          <SelectInput
            placeholder="Filter by Status"
            options={SUPPORT_STATUSES}
            value={SUPPORT_STATUSES.find(s => s.value === filters.status)}
            onChange={(option) => setFilters({ ...filters, status: option?.value })}
          />
          <SelectInput placeholder="Filter by Priority" options={SUPPORT_PRIORITIES} />
        </div>

        {isLoading ? (
          <Loading />
        ) : !data?.data?.length ? (
          <EmptyState title="No support tickets found" />
        ) : (
          <div className="space-y-3">
            {data.data.map((ticket) => (
              <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ticket.user?.email}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(ticket.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={ticket.status}>{ticket.status}</Badge>
                    <Badge variant={ticket.priority === 'urgent' ? 'danger' : 'info'}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Support;
