"use client";

import { useState } from 'react';
import { DataTable } from '@/components/data-grid/data-table';
import { columns } from './columns';
import { useProductionData } from '@/lib/hooks/use-production-data';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DataPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useProductionData({
    page,
    pageSize,
    search,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">생산실적 데이터</h1>
          <p className="text-muted-foreground mt-1">
            전체 생산실적 데이터를 조회하고 관리합니다
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="거래처, 품명, 의뢰번호, 현장 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="pl-8"
            />
          </div>
          <Button onClick={handleSearch}>검색</Button>
          {search && (
            <Button variant="outline" onClick={handleClearSearch}>
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="h-[600px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      ) : data ? (
        <DataTable
          columns={columns}
          data={data.data}
          total={data.total}
          page={page}
          pageSize={pageSize}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : (
        <div className="h-[600px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}
