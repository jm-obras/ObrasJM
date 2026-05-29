'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import { ITEMS_PER_PAGE } from './admin-types'

// ===== TableSkeleton =====
export function TableSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ===== EmptyState =====
export function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={10} className="h-32 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Icon className="h-8 w-8" />
          <p>{message}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ===== PaginationControls =====
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, totalPages, totalItems, onPageChange }: PaginationControlsProps) {
  if (totalItems <= ITEMS_PER_PAGE) return null

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
        {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            if (totalPages <= 7) return true
            if (page === 1 || page === totalPages) return true
            if (Math.abs(page - currentPage) <= 1) return true
            return false
          })
          .map((page, idx, arr) => {
            const prev = arr[idx - 1]
            const showEllipsis = prev !== undefined && page - prev > 1
            return (
              <span key={page} className="flex items-center">
                {showEllipsis && (
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground mx-1" />
                )}
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              </span>
            )
          })}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
