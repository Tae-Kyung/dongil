"use client";

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useProductionTargets } from '@/lib/hooks/use-dashboard-data';
import { Target, Plus, Trash2, Edit, Save, X } from 'lucide-react';

const MONTHS = [
  { value: '1', label: '1월' },
  { value: '2', label: '2월' },
  { value: '3', label: '3월' },
  { value: '4', label: '4월' },
  { value: '5', label: '5월' },
  { value: '6', label: '6월' },
  { value: '7', label: '7월' },
  { value: '8', label: '8월' },
  { value: '9', label: '9월' },
  { value: '10', label: '10월' },
  { value: '11', label: '11월' },
  { value: '12', label: '12월' },
];

export default function TargetsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 새 목표 폼 상태
  const [newTarget, setNewTarget] = useState({
    year: currentYear,
    month: currentMonth,
    targetQuantity: '',
    targetAreaPyeong: '',
    description: '',
  });

  // 수정 폼 상태
  const [editTarget, setEditTarget] = useState({
    targetQuantity: '',
    targetAreaPyeong: '',
    description: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: targets, isLoading } = useProductionTargets(selectedYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleAddTarget = async () => {
    if (!newTarget.targetQuantity || Number(newTarget.targetQuantity) <= 0) {
      toast({
        title: '입력 오류',
        description: '목표 수량을 입력하세요.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('production_targets').insert({
      year: newTarget.year,
      month: newTarget.month,
      target_quantity: Number(newTarget.targetQuantity),
      target_area_pyeong: Number(newTarget.targetAreaPyeong) || 0,
      description: newTarget.description || null,
    });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: '중복 오류',
          description: '해당 연월의 목표가 이미 존재합니다.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '저장 실패',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: '목표 등록 완료',
      description: `${newTarget.year}년 ${newTarget.month}월 목표가 등록되었습니다.`,
    });

    setIsAdding(false);
    setNewTarget({
      year: currentYear,
      month: currentMonth,
      targetQuantity: '',
      targetAreaPyeong: '',
      description: '',
    });
    queryClient.invalidateQueries({ queryKey: ['production-targets'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-achievement'] });
    queryClient.invalidateQueries({ queryKey: ['yearly-achievement-trend'] });
  };

  const handleUpdateTarget = async (id: number) => {
    const { error } = await supabase
      .from('production_targets')
      .update({
        target_quantity: Number(editTarget.targetQuantity),
        target_area_pyeong: Number(editTarget.targetAreaPyeong) || 0,
        description: editTarget.description || null,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: '수정 실패',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '목표 수정 완료',
      description: '목표가 수정되었습니다.',
    });

    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['production-targets'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-achievement'] });
    queryClient.invalidateQueries({ queryKey: ['yearly-achievement-trend'] });
  };

  const handleDeleteTarget = async (id: number) => {
    if (!confirm('이 목표를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('production_targets').delete().eq('id', id);

    if (error) {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '목표 삭제 완료',
      description: '목표가 삭제되었습니다.',
    });

    queryClient.invalidateQueries({ queryKey: ['production-targets'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-achievement'] });
    queryClient.invalidateQueries({ queryKey: ['yearly-achievement-trend'] });
  };

  const startEditing = (target: any) => {
    setEditingId(target.id);
    setEditTarget({
      targetQuantity: String(target.targetQuantity),
      targetAreaPyeong: String(target.targetAreaPyeong),
      description: target.description || '',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            목표 설정
          </h1>
          <p className="text-muted-foreground mt-1">
            월별 생산 목표를 설정하고 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="연도 선택" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            목표 추가
          </Button>
        </div>
      </div>

      {/* 새 목표 추가 폼 */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>새 목표 등록</CardTitle>
            <CardDescription>월별 생산 목표를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>연도</Label>
                <Select
                  value={String(newTarget.year)}
                  onValueChange={(v) => setNewTarget({ ...newTarget, year: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>월</Label>
                <Select
                  value={String(newTarget.month)}
                  onValueChange={(v) => setNewTarget({ ...newTarget, month: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>목표 수량 *</Label>
                <Input
                  type="number"
                  placeholder="예: 20000"
                  value={newTarget.targetQuantity}
                  onChange={(e) => setNewTarget({ ...newTarget, targetQuantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>목표 평수</Label>
                <Input
                  type="number"
                  placeholder="예: 150000"
                  value={newTarget.targetAreaPyeong}
                  onChange={(e) => setNewTarget({ ...newTarget, targetAreaPyeong: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Input
                  placeholder="메모"
                  value={newTarget.description}
                  onChange={(e) => setNewTarget({ ...newTarget, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleAddTarget}>
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 목표 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedYear}년 목표 목록</CardTitle>
          <CardDescription>
            등록된 목표: {targets?.length || 0}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : targets && targets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>연월</TableHead>
                  <TableHead className="text-right">목표 수량</TableHead>
                  <TableHead className="text-right">목표 평수</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {target.year}년 {target.month}월
                      </Badge>
                      {target.year === currentYear && target.month === currentMonth && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800">이번 달</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === target.id ? (
                        <Input
                          type="number"
                          className="w-32 text-right"
                          value={editTarget.targetQuantity}
                          onChange={(e) =>
                            setEditTarget({ ...editTarget, targetQuantity: e.target.value })
                          }
                        />
                      ) : (
                        <span className="font-medium">
                          {target.targetQuantity.toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === target.id ? (
                        <Input
                          type="number"
                          className="w-32 text-right"
                          value={editTarget.targetAreaPyeong}
                          onChange={(e) =>
                            setEditTarget({ ...editTarget, targetAreaPyeong: e.target.value })
                          }
                        />
                      ) : (
                        target.targetAreaPyeong.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === target.id ? (
                        <Input
                          className="w-40"
                          value={editTarget.description}
                          onChange={(e) =>
                            setEditTarget({ ...editTarget, description: e.target.value })
                          }
                        />
                      ) : (
                        target.description || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === target.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleUpdateTarget(target.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(target)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTarget(target.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{selectedYear}년에 등록된 목표가 없습니다.</p>
              <p className="text-sm mt-1">위의 &quot;목표 추가&quot; 버튼을 클릭하여 목표를 등록하세요.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
